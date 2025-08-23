import { Dispatch, Dispatcher } from "react/src/__tests__/currentDispatcher";
import currentDispatcher from "react/src/__tests__/currentDispatcher";
import { FiberNode } from "./fiber";
import { Flags, PassiveEffect, HookHasEffect } from "./fiberFlags";
import internals from "shared/internals";
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue, processUpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";
import { requestUpdateLane, Lane, NoLane } from "./fiberLanes";
import { Update } from "./updateQueue";
import currentBatchConfig from "react/src/__tests__/currentBatchConfig";
let renderLane: Lane = NoLane;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
// 直接使用 react 包中的 currentDispatcher，确保实例一致
// const { currentDispatcher } = internals; // 获取当前调度器

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
        currentDispatcher.current = dispatcher;
    } else {
        //mount
        dispatcher = HooksDispatcherOnMount;
        currentDispatcher.current = dispatcher;
    }

    // 添加保护机制：在组件执行期间，定期检查 currentDispatcher.current 是否被重置
    const originalDispatcher = currentDispatcher.current;
    const checkDispatcher = () => {
        if (currentDispatcher.current !== originalDispatcher) {
            // 恢复正确的 dispatcher
            currentDispatcher.current = originalDispatcher;
        }
    };

    const Component = wip.type; // 获取组件类型
    const props = wip.pendingProps; // 获取待处理的属性

    // 在组件执行前检查
    checkDispatcher();

    // 临时保存当前的 currentDispatcher.current
    const savedDispatcher = currentDispatcher.current;

    // 确保在组件执行期间，currentDispatcher.current 不会被重置
    const safeComponentCall = () => {
        // 在每次 hook 调用前，确保 currentDispatcher.current 是正确的
        if (currentDispatcher.current !== savedDispatcher) {
            currentDispatcher.current = savedDispatcher;
        }
        return Component(props);
    };

    const children = safeComponentCall(); // 调用组件函数获取子节点

    // 在组件执行后检查
    checkDispatcher();

    //重置操作
    currentlyRenderingFiber = null; // 清除当前渲染的fiber节点
    workInProgressHook = null;
    currentHook = null;
    renderLane = NoLane;
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect,
    useTransition: mountTransition
}
const HooksDispatcherUpdate: Dispatcher = {
    useState: updateState,
    useEffect: updateEffect,
    useTransition: updateTransition
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
function updateState<State>(
    initialState: (() => State) | State
): [State, Dispatch<State>] {
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
function mountTransition(): [boolean, (callback: () => void) => void] {
    const [isPending, setPending] = mountState(false);
    const hook = mountWorkInProgressHook();
    const start = startTransition.bind(null, setPending)
    hook.memoizedState = start;
    return [isPending, start];
}

function updateTransition(): [boolean, (callback: () => void) => void] {
    const [isPending] = updateState(false);
    const hook = updateWorkInProgressHook();
    const start = hook.memoizedState
    return [isPending as boolean, start];
}


function startTransition(setPending: Dispatch<boolean>, callback: () => void) {
    setPending(true);
    const prevTransition = currentBatchConfig.transition;
    currentBatchConfig.transition = 1;

    callback();
    setPending(false);

    currentBatchConfig.transition = prevTransition;
}

function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>) {
    const lane = requestUpdateLane();
    const update = createUpdate(action, lane);
    enqueueUpdate(updateQueue, update);
    scheduleUpdateOnFiber(fiber, lane);
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
