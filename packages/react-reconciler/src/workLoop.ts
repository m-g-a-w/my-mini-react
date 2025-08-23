import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import { beginWork } from './beginWork';
import { HostRoot } from './workTags';
import { NoFlags, MutationMask, PassiveMask, Flags, HookHasEffect, PassiveEffect } from './fiberFlags';
import { commitMutationEffects, commitLayoutEffects } from './commitwork';
import { Lane, NoLane, SyncLane, mergeLanes, getHighestPriorityLane, markRootFinished } from './fiberLanes';
import { scheduleSyncCallback, flushSyncTaskQueue } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import { resetHooksState } from './fiberHooks';
import {
    unstable_scheduleCallback as scheduleCallback,
    unstable_NormalPriority as NormalPriority,
    unstable_shouldYield,
    unstable_cancelCallback
} from 'scheduler';
import { lanesToSchedulerPriority } from './fiberLanes';
import { Effect } from './fiberHooks';
import { commitHookEffectListUnmount, commitHookEffectListDestroy, commitHookEffectListCreate } from './commitwork';
import { setScheduler } from './scheduler';



let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffect: Boolean = false;

type RootExitSratus = number
const RootInComplete = 1;
const RootCompleted = 2;
const RootInProgress = 3;


function markRootUpdated(root: FiberRootNode, lane: Lane) {
    root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
    root.finishedLane = NoLane;
    root.finishedWork = null;
    workInProgress = createWorkInProgress(root.current, {}); // 设置当前工作中的Fiber节点
    wipRootRenderLane = lane;
}
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
    //调度功能
    const root = markUpdateFromFiberToRoot(fiber); // 标记从Fiber节点到根节点的更新
    markRootUpdated(root, lane);
    ensureRootIsScheduled(root); // 渲染根节点
}
function ensureRootIsScheduled(root: FiberRootNode) {
    const updateLane = getHighestPriorityLane(root.pendingLanes);
    const exitingCallback = root.callbackNode;
    if (updateLane === NoLane) {
        if(exitingCallback !== null){
            unstable_cancelCallback(exitingCallback);
        }
        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return;
    }
    const curPriority = updateLane
    const prevPriority = root.callbackPriority;
    if(prevPriority === curPriority){
        return; 
    }
    if(exitingCallback !== null){
        unstable_cancelCallback(exitingCallback);
    }
    let newCallbackNode = null;
    if (updateLane === SyncLane) {
        if (__DEV__) {
            console.log(`在微任务中调度，优先级：${updateLane}`);
        }
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
        scheduleMicroTask(flushSyncTaskQueue);
    } else {
        const schedulerPriority = lanesToSchedulerPriority(updateLane);
        newCallbackNode = scheduleCallback(
            schedulerPriority,
            performConcurrentWorkOnRoot.bind(null, root) as any
        )
    }
    root.callbackNode = newCallbackNode;
    root.callbackPriority = curPriority;
}
function performConcurrentWorkOnRoot(
    root: FiberRootNode,
    didTimeOut: Boolean
):any {
    //保证useEffect回调被执行
    const curCallback = root.callbackNode;
    const didFlushPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects);
    if(didFlushPassiveEffect){
        if(root.callbackNode !== curCallback){
            return null;
        }
    }
    const lane = getHighestPriorityLane(root.pendingLanes);
    const curCallbackNode = root.callbackNode;
    if (lane === NoLane) {
        ensureRootIsScheduled(root);
        return null;
    }
    const needSync = lane === SyncLane || didTimeOut;
    //render阶段
    const exitStatus = renderRoot(root, lane, !needSync);
    ensureRootIsScheduled(root);
    if(exitStatus === RootInProgress){
        if(root.callbackNode !== curCallbackNode){
            return null
        }
        return performSyncWorkOnRoot.bind(null, root);
    }
    if(exitStatus === RootCompleted){
        const finishedWork = root.current.alternate;
        root.finishedWork = finishedWork;
        root.finishedLane = lane;
        wipRootRenderLane = NoLane;
        commitRoot(root);
    }else if(__DEV__){
        console.error('还有未实现的并发更新结束状态');
    }
    return null;
}
function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: Boolean) {
    if (__DEV__) {
        console.log(`开始 ${shouldTimeSlice ? "并发" : "同步"}更新`, root);
    }
    if (wipRootRenderLane !== lane) {
        prepareFreshStack(root, lane);
    }
    do {
        try {
            shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
            break; // 如果工作循环完成，跳出循环
        } catch (error) {
            // 处理错误逻辑，例如记录错误或重置工作状态
            if (__DEV__) {
                console.error('workLoopSync发生错误:', error);
            }
            workInProgress = null; // 重置当前工作中的Fiber节点
            // 重置 hook 相关的全局状态
            resetHooksState();
        }
    } while (true);

    //终端执行 || render阶段执行完
    if (shouldTimeSlice && workInProgress !== null) {
        return RootInProgress;
    }
    if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
        console.error('render阶段未完成，但workInProgress为null');
    }
    return RootCompleted;

}
function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    let parent = fiber.return; // 获取父节点
    while (parent !== null) {
        node = parent; // 向上回溯到根节点
        parent = parent.return; // 获取父节点
    }
    if (node.tag === HostRoot) { // 如果根节点是HostRoot类型
        return node.stateNode; // 返回根节点的状态节点
    }
    return null; // 如果没有找到根节点，返回null
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
    const nextLane = getHighestPriorityLane(root.pendingLanes);
    if (nextLane !== SyncLane) {
        ensureRootIsScheduled(root);
        return;
    }
    prepareFreshStack(root, lane)
    if (workInProgress === null) {
        if (__DEV__) {
            console.warn('workInProgress 为 null，跳过渲染');
        }
        return;
    }
    const exitStatus = renderRoot(root, nextLane, false);
    if (exitStatus === RootCompleted) {
        const finishedWork = root.current.alternate
        root.finishedWork = finishedWork; // 设置完成的工作节点
        root.finishedLane = nextLane;
        wipRootRenderLane = NoLane;
    } else if (__DEV__) {
        console.error('render阶段未完成，但workInProgress为null');
    }

    commitRoot(root); // 提交根节点
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork;
    if (finishedWork === null) {
        return; // 如果没有完成的工作节点，直接返回
    }

    if (__DEV__) {
        console.warn('commit阶段开始', finishedWork);
    }
    const lane = root.finishedLane;
    if (lane === NoLane && __DEV__) {
        console.error('commit阶段finishedlane不应该为NoLane')
    }
    //重置
    root.finishedWork = null;
    root.finishedLane = NoLane;

    // 清除已完成的 lane，防止重复调度
    if (lane !== NoLane) {
        markRootFinished(root, lane);
    }

    //判断是否存在3个子阶段需要执行的操作
    const subtreeFlags = (finishedWork.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags; // 检查子树标记是否包含变更标记
    const rootHasEffect = (finishedWork.flags & (MutationMask | PassiveMask)) !== NoFlags; // 检查根节点是否有副作用标记
    if (subtreeFlags || rootHasEffect) {
        //beforeMutation
        //mutation Placement
        commitMutationEffects(finishedWork, root);
        root.current = finishedWork; // 更新当前节点为完成的工作节点
        //layout
        commitLayoutEffects(finishedWork, root);
    } else {
        root.current = finishedWork;
    }

    // 在mutation effects执行完后，检查是否需要调度passive effects
    if (
        (finishedWork.flags & PassiveMask) !== NoFlags
        || (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
        || root.pendingPassiveEffects.unmount.length > 0
        || root.pendingPassiveEffects.update.length > 0
    ) {
        if (!rootDoesHasPassiveEffect) {
            rootDoesHasPassiveEffect = true;
            //调度副作用
            scheduleCallback(NormalPriority, () => {
                //执行副作用
                flushPassiveEffects(root.pendingPassiveEffects)
                rootDoesHasPassiveEffect = false;
                return
            })
        }
    }
    ensureRootIsScheduled(root);
}

function workLoopSync() {
    while (workInProgress !== null) {
        // 执行工作单元
        performUnitOfWork(workInProgress);
    }
}
function workLoopConcurrent() {
    while (workInProgress !== null && !unstable_shouldYield()) {
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber, wipRootRenderLane);
    fiber.memoizedProps = fiber.pendingProps; // 将待处理的属性设置为已处理的属性
    if (next === null) {
        completeUnitOfWork(fiber); // 如果没有下一个工作单元，完成当前工作单元
    } else {
        workInProgress = next; // 设置下一个工作单元为当前工作中的Fiber节点
    }
}
function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
    let didFlushPassiveEffect = false;
    pendingPassiveEffects.unmount.forEach((effect) => {
        didFlushPassiveEffect = true;
        commitHookEffectListUnmount(PassiveEffect, effect);
    });
    pendingPassiveEffects.unmount = [];

    pendingPassiveEffects.update.forEach((effect) => {
        didFlushPassiveEffect = true;
        commitHookEffectListDestroy(PassiveEffect | HookHasEffect, effect);
    });
    pendingPassiveEffects.update.forEach((effect) => {
        didFlushPassiveEffect = true;
        commitHookEffectListCreate(PassiveEffect | HookHasEffect, effect);
    });
    pendingPassiveEffects.update = [];
    flushSyncTaskQueue();
    return didFlushPassiveEffect;
}

function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber;
    do {
        completeWork(node); // 完成当前工作单元
        const sibling = node.sibling; // 获取兄弟节点
        if (sibling !== null) {
            workInProgress = sibling; // 如果有兄弟节点，设置为当前工作中的Fiber节点
            return; // 结束当前工作单元的处理
        }
        node = node.return; // 向上回溯到父节点
        workInProgress = node; // 更新当前工作中的Fiber节点
    } while (node !== null);
}

// 注册调度器，打破循环依赖
setScheduler({
    scheduleUpdateOnFiber
});