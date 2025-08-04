import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode } from './fiber';
import { beginWork } from './beginWork';
import { FiberRootNode } from './fiber';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

function prepareRefreshStack(root: FiberRootNode) {
    workInProgress = createWorkInProgress(root.current,{}); // 设置当前工作中的Fiber节点

}
export function scheduleUpdateOnFiber(fiber: FiberNode){
    //调度功能
    const root = markUpdateFromFiberToRoot(fiber); // 标记从Fiber节点到根节点的更新
    renderRoot(root); // 渲染根节点
}
function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    let parent = fiber.return; // 获取父节点
    while(parent !== null) {
        node = parent; // 向上回溯到根节点
        parent = parent.return; // 获取父节点
    }
    if(node.tag === HostRoot) { // 如果根节点是HostRoot类型
        return node.stateNode; // 返回根节点的状态节点
    }
    return null; // 如果没有找到根节点，返回null
}

function renderRoot(root: FiberRootNode) {
    prepareRefreshStack(root)
    do{
        try{
            workLoop();
            break; // 如果工作循环完成，跳出循环
        }catch(error) {
            console.error('Error during work loop:', error);
            // 处理错误逻辑，例如记录错误或重置工作状态
            workInProgress = null; // 重置当前工作中的Fiber节点
        }
    }while(true);
}
function workLoop() {
    while(workInProgress !== null) {
        // 执行工作单元
        performUnitOfWork(workInProgress);
    }
}
function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber);
    fiber.memoizedProps = fiber.pengingProps; // 将待处理的属性设置为已处理的属性
    if(next === null) {
        completeUnitOfWork(fiber); // 如果没有下一个工作单元，完成当前工作单元
    }else{
        workInProgress = next; // 设置下一个工作单元为当前工作中的Fiber节点
    }
}
function completeUnitOfWork(fiber: FiberNode) {
    let node :FiberNode | null = fiber;
    do {
        completeWork(node); // 完成当前工作单元
        const sibling = node.sibling; // 获取兄弟节点
        if(sibling !== null) {
            workInProgress = sibling; // 如果有兄弟节点，设置为当前工作中的Fiber节点
            return; // 结束当前工作单元的处理
        }
        node = node.return; // 向上回溯到父节点
        workInProgress = node; // 更新当前工作中的Fiber节点
    } while(node !== null);
}