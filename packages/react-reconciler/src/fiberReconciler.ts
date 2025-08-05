import {Container} from 'hostConfig'
import { HostRoot } from './workTags';
import { FiberNode, FiberRootNode } from './fiber';
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue';
import type{ ReactElement } from 'shared/ReactTypes';
import {scheduleUpdateOnFiber} from './workLoop'; 

export function createContainer(container: Container){
    const hostRootFiber = new FiberNode(HostRoot, {}, null); // 创建根Fiber节点
    const root = new FiberRootNode(container, hostRootFiber); // 创建Fiber根节点
    hostRootFiber.updateQueue = createUpdateQueue(); // 初始化更新队列
    return root;
}
export function updateContainer(element: ReactElement | null,root: FiberRootNode){
    const hostRootFiber = root.current; // 获取当前的根Fiber节点
    const update = createUpdate<ReactElement | null>(element); // 创建更新
    enqueueUpdate((hostRootFiber.updateQueue) as UpdateQueue<ReactElement | null>,update); // 将更新添加到更新队列
    scheduleUpdateOnFiber(hostRootFiber); // 调度更新
    return element; // 返回更新的元素
}