import { FiberNode } from "./fiber";
import internals from "shared/internats";

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
        // currentDispatcher.current = 
    }
    const Component = wip.type; // 获取组件类型
    const props = wip.pengingProps; // 获取待处理的属性
    const children = Component(props); // 调用组件函数获取子节点
    
    //重置操作
    currentlyRenderingFiber = null; // 清除当前渲染的fiber节点
    return children
}