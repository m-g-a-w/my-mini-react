import { FiberNode } from "./fiber";
import { HostRoot,HostText,HostComponent } from "./workTags";
import {processUpdateQueue} from "./updateQueue";
import { ReactElement } from "shared/ReactTypes";
import { reconcileChildFibers, mountChildFibers } from "./childFibers";
//递归中的递阶段
export const beginWork = (wip: FiberNode) => {
    //比较，返回子fiberNode
    switch(wip.tag) {
        case HostRoot:
            return updateHostRoot(wip); // 更新根节点
        case HostComponent: 
            return updateHostComponent(wip); // 更新组件节点
        case HostText: 
            return null;
        default:
            if(__DEV__) {
                console.warn('beginWork未实现的类型');
            }
            break;
    }
    return null
}
function updateHostRoot(wip: FiberNode) {
    const baseState = wip.memoizedProps; // 获取基础状态
    const updateQueue = wip.updateQueue; // 获取更新队列
    const pending = updateQueue.shared.pending; // 获取待处理的更新
    updateQueue.shared.pending = null; // 清空待处理的更新
    const { memoizedState } = processUpdateQueue(baseState, pending); // 处理更新队列
    wip.memoiszedState = memoizedState; // 更新已处理状态

    const nextChildren = wip.memoiszedState; // 获取待处理的子节点
    reconileChildren(wip, nextChildren); // 递归处理子节点
    return wip.child; // 返回子节点
}
function updateHostComponent(wip: FiberNode) {
    const nextProps = wip.pengingProps; // 获取待处理的属性
    const nextChildren = nextProps.children; // 获取待处理的属性
    reconileChildren(wip, nextChildren); // 递归处理子节点
    return wip.child; // 返回子节点
}
function reconileChildren(wip: FiberNode, children?: ReactElement) {
    const current = wip.alternate; // 获取备用节点
    if(current !== null) {
        //update
        wip.child = reconcileChildFibers(wip, current?.child, children); // 更新子节点
    }else{
        wip.child = mountChildFibers(wip, null, children); // 创建新的子节点
    }
}