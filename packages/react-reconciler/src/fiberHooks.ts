import { Dispatch,Dispatcher } from "react/src/currentDispatcher";
import { FiberNode } from "./fiber";
import { Flags, PassiveEffect, HookHasEffect } from "./fiberFlags";
import internals from "shared/internals";
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue, processUpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";
import { requestUpdateLane,Lane,NoLane } from "./fiberLanes";


let renderLane: Lane = NoLane;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
const { currentDispatcher } = internals; // 获取当前调度器

export interface FCUpdateQueue<State> extends UpdateQueue<State>{
    lastEffect: Effect | null;
}

interface Hook {
    memoizedState: any; // 存储hook的状态
    updateQueue: any; // 存储更新队列
    next: Hook | null; // 链表结构的下一个hook    
}
export interface Effect {
    tag: Flags;
    create: EffectCallback | void;
    destory: EffectCallback | void;
    deps: EffectDeps,
    next: Effect | null

}
type EffectCallback = () => void | null;
type EffectDeps = any[] | null;

export function renderWithHooks(wip: FiberNode,lane: Lane) {
    currentlyRenderingFiber = wip; // 设置当前正在渲染的fiber节点
    renderLane = lane;
    const current = wip.alternate; // 获取备用节点
    if (current !== null) {
        //update
        currentDispatcher.current = HooksDispatcherUpdate
        // 在更新时，保持之前的hook状态
        wip.memoizedState = current.memoizedState;
    } else {
        //mmount
        currentDispatcher.current = HooksDispatcherOnMount
        wip.memoizedState = null; // 初始化memoizedState为null
    }
    const Component = wip.type; // 获取组件类型
    const props = wip.pendingProps; // 获取待处理的属性
    const children = Component(props); // 调用组件函数获取子节点

    //重置操作
    currentlyRenderingFiber = null; // 清除当前渲染的fiber节点
    workInProgressHook = null;
    currentHook = null;
    renderLane = NoLane;
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect
}
const HooksDispatcherUpdate: Dispatcher = {
    useState: updateState,
    useEffect: mountEffect
}
function mountEffect(create: EffectCallback | void,deps: EffectDeps | void){
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect

    hook.memoizedState = pushEffect(PassiveEffect | HookHasEffect ,create,undefined,nextDeps);
}
function pushEffect(hookFlags: Flags,
    create: EffectCallback | void,
    destory: EffectCallback | void,
    deps: EffectDeps): Effect{
    const effect: Effect = {
        tag: hookFlags,
        create,
        destory,
        deps,
        next:null
    }
    const fiber = currentlyRenderingFiber as FiberNode;
    const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
    if(updateQueue === null){
        const updateQueue = createFCUpdateQueue();
        fiber.updateQueue = updateQueue;
        effect.next = effect;
        updateQueue.lastEffect = effect;
    }
    else{
        //插入effect
        const lastEffect = updateQueue.lastEffect;
        if(lastEffect === null){
            effect.next = effect;
            updateQueue.lastEffect = effect;
        }else{
            const firstEffect = updateQueue.lastEffect;
            lastEffect.next = effect;
            effect.next = firstEffect;
            updateQueue.lastEffect = effect;
        }
    }
    return effect;
}
function createFCUpdateQueue<State>(){
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
    const pending = queue.shared.pending;
    if(pending !== null) {
        const { memoizedState } = processUpdateQueue(hook.memoizedState, pending, renderLane);
        hook.memoizedState = memoizedState;
        queue.shared.pending = null; // 清空已处理的更新队列
    }
    return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}
function updateWorkInProgressHook(): Hook {
    let nextCurrentHook: Hook | null = null;
    if (currentHook === null) {
        const current = currentlyRenderingFiber?.alternate;
        if (current !== null) {
            nextCurrentHook = current?.memoizedState;
        }
        else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }
    if (nextCurrentHook === null) {
        throw new Error(`当前组件: ${currentlyRenderingFiber?.type} 在更新时hook比上一次多`);
    }
    currentHook = nextCurrentHook as Hook;
    const newHook: Hook = {
        memoizedState: currentHook.memoizedState,
        updateQueue: currentHook.updateQueue,
        next: null
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

function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>) {
    const lane = requestUpdateLane();
    const update = createUpdate(action, lane);
    enqueueUpdate(updateQueue, update);
    scheduleUpdateOnFiber(fiber,lane);
}
function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null, // 初始化hook的状态为null
        updateQueue: null, // 初始化更新队列为null
        next: null // 链表结构的下一个hook
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
