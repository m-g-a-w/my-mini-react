import { FiberNode } from "./fiber";
import { Flags, PassiveEffect, HookHasEffect } from "./fiberFlags";
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue, processUpdateQueue } from "./updateQueue";
import { Action } from "../../shared/ReactTypes";
import { getScheduler } from "./scheduler";
import { requestUpdateLane, Lane, NoLane } from "./fiberLanes";
import { Update } from "./updateQueue";
import { Dispatcher, Dispatch, resolveDispatcher } from "./currentDispatcher";
import ReactCurrentBatchConfig from "./ReactCurrentBatchConfig";

let renderLane: Lane = NoLane;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
    lastEffect: Effect | null;
}

interface Hook {
    memoizedState: any; // 存储hook的状态
    updateQueue: any; // 存储更新队列
    next: Hook | null; // 链表结构的下一个hook  
    baseState: any; // 存储baseState
    baseQueue: Update<any> | null;
}
export interface Effect {
    tag: Flags;
    create: EffectCallback | void;
    destroy: EffectCallback | void;
    deps: EffectDeps,
    next: Effect | null

}
type EffectCallback = () => (() => void) | void;
type EffectDeps = any[] | null;

export function renderWithHooks(wip: FiberNode, lane: Lane) {
    currentlyRenderingFiber = wip; // 设置当前正在渲染的fiber节点
    renderLane = lane;

    // 重置 hook 相关状态，确保每次渲染都从干净的状态开始
    wip.memoizedState = null;
    wip.updateQueue = null;

    const current = wip.alternate; // 获取备用节点
    let dispatcher;
    if (current !== null) {
        //update
        dispatcher = HooksDispatcherUpdate;
    } else {
        //mount
        dispatcher = HooksDispatcherOnMount;
    }
    
    // 设置 dispatcher
    (globalThis as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
        currentDispatcher: { current: dispatcher }
    };

    const Component = wip.type; // 获取组件类型
    const props = wip.pendingProps; // 获取待处理的属性

    const children = Component(props); // 调用组件函数获取子节点

    // 在组件函数执行完成后，重置 hook 相关状态
    // 注意：不要清除 currentDispatcher.current，让它在整个渲染周期中保持有效
    // 也不要立即清除 currentlyRenderingFiber，因为 hooks 可能还需要访问它
    workInProgressHook = null;
    currentHook = null;
    renderLane = NoLane;
    
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect,
    useTransition: mountTransition,
    useRef: mountRef
}
const HooksDispatcherUpdate: Dispatcher = {
    useState: updateState,
    useEffect: updateEffect,
    useTransition: updateTransition,
    useRef: updateRef
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect

    hook.memoizedState = pushEffect(PassiveEffect | HookHasEffect, create, undefined, nextDeps);
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy: EffectCallback | void = undefined;

    if (currentHook !== null) {
        const prevEffect = currentHook.memoizedState as Effect;
        destroy = prevEffect.destroy;

        if (nextDeps !== null) {
            //浅比较依赖
            const prevDeps = prevEffect.deps;
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                hook.memoizedState = pushEffect(PassiveEffect, create, destroy, nextDeps);
                return;
            }
        }
        //浅比较 不相等
        (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
        hook.memoizedState = pushEffect(
            PassiveEffect | HookHasEffect,
            create,
            destroy,
            nextDeps
        );
    }
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
    if (prevDeps === null || nextDeps === null) {
        return false;
    }
    if (prevDeps.length === 0 && nextDeps.length === 0) {
        return true;
    }
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(prevDeps[i], nextDeps[i])) {
            continue
        }
        return false;
    }
    return true
}

function pushEffect(hookFlags: Flags,
    create: EffectCallback | void,
    destroy: EffectCallback | void,
    deps: EffectDeps): Effect {
    const effect: Effect = {
        tag: hookFlags,
        create,
        destroy,
        deps,
        next: null
    }
    const fiber = currentlyRenderingFiber as FiberNode;
    const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
    if (updateQueue === null) {
        const newUpdateQueue = createFCUpdateQueue();
        fiber.updateQueue = newUpdateQueue;
        effect.next = effect;
        newUpdateQueue.lastEffect = effect;
    }
    else {
        //插入effect
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect === null) {
            effect.next = effect;
            updateQueue.lastEffect = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            updateQueue.lastEffect = effect;
        }
    }
    return effect;
}

function createFCUpdateQueue<State>() {
    const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>
    updateQueue.lastEffect = null;
    return updateQueue;
}


function mountState<State>(
    initialState: (() => State) | State
): [State, Dispatch<State>] {
    const hook = mountWorkInProgressHook(); // 创建一个新的hook
    let memoizedState; // 定义hook的状态
    if (initialState instanceof Function) {
        // 如果初始状态是一个函数，则调用它
        memoizedState = initialState();
    } else {
        // 否则直接使用初始状态
        memoizedState = initialState;
    }
    const queue = createUpdateQueue<State>(); // 创建一个更新队列
    hook.updateQueue = queue; // 将更新队列赋值给hook
    hook.memoizedState = memoizedState; // 设置hook的初始状态
    hook.baseState = memoizedState;
    // @ts-ignore
    const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
    queue.dispatch = dispatch
    return [memoizedState, dispatch];
}
function updateState<State>(): [State, Dispatch<State>] {
    const hook = updateWorkInProgressHook(); // 获取当前hook
    //计算新state的逻辑
    const queue = hook.updateQueue as UpdateQueue<State>;
    const baseState = hook.baseState;

    const pending = queue.shared.pending;
    const current = currentHook as Hook
    let baseQueue = current.baseQueue;
    //pending baseQueue update保存在current中


    if (pending !== null) {
        if (baseQueue !== null) {
            const baseFirst = baseQueue.next;
            let pendingFirst = pending.next;

            baseQueue.next = pendingFirst;
            pending.next = baseFirst;
        }
        baseQueue = pending;
        current.baseQueue = pending;
        queue.shared.pending = null;
        // Remove this line since memoizedState is not defined in this scope
        queue.shared.pending = null; // 清空已处理的更新队列
    }
    if (baseQueue !== null) {
        const { memoizedState,
            baseQueue: newBaseQueue,
            baseState: newBaseState
        } = processUpdateQueue(hook.memoizedState, pending, renderLane);
        hook.memoizedState = memoizedState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueue;
        return [memoizedState, queue.dispatch as Dispatch<State>];
    }
    return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}
function updateWorkInProgressHook(): Hook {
    let nextCurrentHook: Hook | null = null;
    if (currentHook === null) {
        // 第一次调用 updateWorkInProgressHook，从 current fiber 获取第一个 hook
        const current = currentlyRenderingFiber?.alternate;
        if (current !== null && current !== undefined) {
            nextCurrentHook = current.memoizedState;
        }
        else {
            nextCurrentHook = null;
        }
    } else {
        // 后续调用，获取下一个 hook
        nextCurrentHook = currentHook.next;
    }

    // 如果 nextCurrentHook 为 null，说明 hook 数量不匹配
    // 这在 React 中是不允许的，应该抛出错误
    if (nextCurrentHook === null) {
        throw new Error(`当前组件: ${currentlyRenderingFiber?.type} 在更新时hook比上一次多`);
    }

    currentHook = nextCurrentHook as Hook;
    const newHook: Hook = {
        memoizedState: currentHook.memoizedState,
        updateQueue: currentHook.updateQueue,
        next: null,
        baseState: currentHook.baseState,
        baseQueue: currentHook.baseQueue
    }

    if (workInProgressHook === null) {
        if (currentlyRenderingFiber === null) {
            throw new Error('hook只能在函数组件中执行');
        } else {
            workInProgressHook = newHook;
            currentlyRenderingFiber.memoizedState = workInProgressHook;
        }
    } else {
        workInProgressHook.next = newHook;
        workInProgressHook = newHook;
    }
    return workInProgressHook;
}
function mountRef<T>(initialValue: T): {current: T} {
    const hook = mountWorkInProgressHook();
    const ref = { current: initialValue };
    hook.memoizedState = ref;
    return ref;
}
function updateRef<T>(initialValue: T): {current: T} {
    const hook = updateWorkInProgressHook();
    return hook.memoizedState
}
function mountTransition(): [boolean, (callback: () => void) => void] {
    const hook = mountWorkInProgressHook();
    const isPending = false;
    
    // 设置hook的状态
    hook.memoizedState = isPending;
    
    // 创建setPending函数
    const setPending = (action: Action<boolean>) => {
        if (typeof action === 'function') {
            hook.memoizedState = action(hook.memoizedState);
        } else {
            hook.memoizedState = action;
        }
    };
    
    const start = (callback: () => void) => startTransition(setPending, callback);
    
    return [isPending, start];
}

function updateTransition(): [boolean, (callback: () => void) => void] {
    const hook = updateWorkInProgressHook();
    const isPending = hook.memoizedState;
    
    // 创建setPending函数
    const setPending = (action: Action<boolean>) => {
        if (typeof action === 'function') {
            hook.memoizedState = action(hook.memoizedState);
        } else {
            hook.memoizedState = action;
        }
    };
    
    const start = (callback: () => void) => startTransition(setPending, callback);
    
    return [isPending, start];
}


function startTransition(setPending: Dispatch<boolean>, callback: () => void) {
    setPending(true);
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = 1;

    try {
        callback();
    } finally {
        // 使用 setTimeout 来延迟设置 pending 为 false
        // 这样可以确保 transition 完成后再更新状态
        setTimeout(() => {
            setPending(false);
        }, 0);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}

function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>) {
    const lane = requestUpdateLane();
    const update = createUpdate(action, lane);
    enqueueUpdate(updateQueue, update);
    getScheduler().scheduleUpdateOnFiber(fiber, lane);
}
function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null, // 初始化hook的状态为null
        updateQueue: null, // 初始化更新队列为null
        next: null, // 链表结构的下一个hook
        baseState: null,
        baseQueue: null
    };

    if (workInProgressHook === null) {
        // 第一个hook 并且是mount时候
        if (currentlyRenderingFiber === null) {
            throw new Error('hook只能在函数组件中执行');
        } else {
            workInProgressHook = hook
            currentlyRenderingFiber.memoizedState = workInProgressHook
        }
    } else {
        // 非第一个hook mount后续的hook
        workInProgressHook.next = hook; // 将新hook添加到链表中
        workInProgressHook = hook; // 更新当前工作中的hook
    }
    return workInProgressHook; // 返回当前工作中的hook
}

export function resetHooksState() {
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    renderLane = NoLane;
    // 不要重置 currentDispatcher.current，因为组件可能还在渲染中
    // currentDispatcher.current = null;
}
