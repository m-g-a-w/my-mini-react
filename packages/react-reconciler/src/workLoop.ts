import { completeWork } from './completeWork';
import { FiberNode } from './fiber';
import { beginWork } from './beginWork';

let workInProgress: FiberNode | null = null;

function prepareRefreshStack(fiber: FiberNode) {
    workInProgress = fiber; // 设置当前工作中的Fiber节点
}
function renderRoot(root: FiberNode) {
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