import { Dispatch } from "react/src/currentDispatcher";
import { Dispatcher } from "react/src/currentDispatcher";
import { FiberNode } from "./fiber";
import internals from "shared/internals";
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";


let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
const {currentDispatcher} = internals; // 获取当前调度器

interface Hook {
    memoizedState: any; // 存储hook的状态
    updateQueue: any; // 存储更新队列
    next: Hook | null; // 链表结构的下一个hook    
}

export function renderWithHooks(wip: FiberNode){
    currentlyRenderingFiber = wip; // 设置当前正在渲染的fiber节点
    wip.memoizedState = null; // 初始化memoizedState为null

    const current = wip.alternate; // 获取备用节点
    if(current !== null) {
        //update
    }else{
        //mmount
        currentDispatcher.current = HooksDispatcherOnMount
    }
    const Component = wip.type; // 获取组件类型
    const props = wip.pengingProps; // 获取待处理的属性
    const children = Component(props); // 调用组件函数获取子节点
    
    //重置操作
    currentlyRenderingFiber = null; // 清除当前渲染的fiber节点
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState
}

function mountState<State>(
    initialState: (() => State) | State
): [State, Dispatch<State>] {
        const hook = mountWorkInProgressHook(); // 创建一个新的hook
    let memoizedState; // 定义hook的状态
        if(initialState instanceof Function) {
            // 如果初始状态是一个函数，则调用它
            memoizedState = initialState();
    } else {
            // 否则直接使用初始状态
            memoizedState = initialState;
        }
        const queue = createUpdateQueue<State>(); // 创建一个更新队列
        hook.updateQueue = queue; // 将更新队列赋值给hook

    // @ts-ignore
    const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
    queue.dispatch = dispatch
    return [memoizedState, dispatch];
}
function dispatchSetState<State>(
    fiber: FiberNode, 
    updateQueue: UpdateQueue<State>,
    action: Action<State>) {
    const update = createUpdate(action);
    enqueueUpdate(updateQueue, update);
    scheduleUpdateOnFiber(fiber);
    }
function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null, // 初始化hook的状态为null
        updateQueue: null, // 初始化更新队列为null
        next: null // 链表结构的下一个hook
    };

    if(workInProgressHook === null) {
        // 第一个hook 并且是mount时候
        if(currentlyRenderingFiber === null) {
            throw new Error('hook只能在函数组件中执行');
        }else{
            workInProgressHook = hook
            currentlyRenderingFiber.memoizedState = workInProgressHook
        }
    }else{
        // 非第一个hook mount后续的hook
        workInProgressHook.next = hook; // 将新hook添加到链表中
        workInProgressHook = hook; // 更新当前工作中的hook
    }
    return workInProgressHook; // 返回当前工作中的hook
}
