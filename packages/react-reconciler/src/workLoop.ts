import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode,FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { HostRoot } from './workTags';
import {NoFlags,MutationMask} from './fiberFlags';
import { commitMutationEffects } from './commitwork';
import { Lane, mergeLanes } from './fiberLanes';

let workInProgress: FiberNode | null = null;

function markRootUpdated(root: FiberRootNode,lane: Lane){
    root.pendingLanes = mergeLanes(root.pendingLanes,lane);
}

function prepareRefreshStack(root: FiberRootNode) {
    if (root.current === null) {
        if (__DEV__) {
            console.warn('root.current 为 null');
        }
        return;
    }
    workInProgress = createWorkInProgress(root.current,{}); // 设置当前工作中的Fiber节点
}
export function scheduleUpdateOnFiber(fiber: FiberNode,lane: Lane){
    //调度功能
    const root = markUpdateFromFiberToRoot(fiber); // 标记从Fiber节点到根节点的更新
    markRootUpdated(root,lane);
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
    
    if (workInProgress === null) {
        if (__DEV__) {
            console.warn('workInProgress 为 null，跳过渲染');
        }
        return;
    }
    
    do{
        try{
            workLoop();
            break; // 如果工作循环完成，跳出循环
        }catch(error) {
            // 处理错误逻辑，例如记录错误或重置工作状态
            if(__DEV__) {
                console.error('workLoop发生错误:', error);
            }
            workInProgress = null; // 重置当前工作中的Fiber节点
        }
    }while(true);
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork; // 设置完成的工作节点
    commitRoot(root); // 提交根节点
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork; // 获取完成的工作节点
    if(finishedWork === null) {
        return; // 如果没有完成的工作节点，直接返回
    }

    if(__DEV__) {
        console.warn('commit阶段开始', finishedWork);
    }
    //重置
    root.finishedWork = null; 
    
    //判断是否存在3个子阶段需要执行的操作
    const subtreeFlags = (finishedWork.subtreeFlags & (MutationMask)) !== NoFlags; // 检查子树标记是否包含变更标记
    const rootHasEffect = (finishedWork.flags & (MutationMask)) !== NoFlags; // 检查根节点是否有副作用标记
    if(subtreeFlags || rootHasEffect) {
        //beforeMutation
        //mutation Placement
        commitMutationEffects(finishedWork);
        
        root.current = finishedWork; // 更新当前节点为完成的工作节点
        
        //layout
    }else{
        root.current = finishedWork;
    }

}

function workLoop() {
    while(workInProgress !== null) {
        // 执行工作单元
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber);
    fiber.memoizedProps = fiber.pendingProps; // 将待处理的属性设置为已处理的属性
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