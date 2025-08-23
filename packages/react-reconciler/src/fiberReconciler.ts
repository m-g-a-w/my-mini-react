import { HostRoot } from './workTags';
import { FiberNode, FiberRootNode } from './fiber';
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue';
import type{ ReactElement } from '../../shared/ReactTypes';
import {scheduleUpdateOnFiber} from './workLoop'; 
import { requestUpdateLane } from './fiberLanes';
import { Container } from 'hostConfig';
import { unstable_runWithPriority, unstable_ImmediatePriority } from 'scheduler';

export function createContainer(container: Container){
    const hostRootFiber = new FiberNode(HostRoot, {}, null); // 创建根Fiber节点
    const root = new FiberRootNode(container, hostRootFiber); // 创建Fiber根节点
    hostRootFiber.updateQueue = createUpdateQueue<ReactElement | null>(); // 初始化更新队列
    hostRootFiber.memoizedState = null; // 初始化memoizedState为null
    return root;
}
export function updateContainer(
    element: ReactElement | null,
    root: FiberRootNode
){
    unstable_runWithPriority(unstable_ImmediatePriority,() => {
        const hostRootFiber = root.current; // 获取当前的根Fiber节点
        const lane = requestUpdateLane();
        const update = createUpdate<ReactElement | null>(element,lane); // 创建更新
        enqueueUpdate((hostRootFiber.updateQueue) as UpdateQueue<ReactElement | null>,update); // 将更新添加到更新队列
        scheduleUpdateOnFiber(hostRootFiber,lane); // 调度更新
        return element; // 返回更新的元素
    })
}