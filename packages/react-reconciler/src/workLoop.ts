import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import { beginWork } from './beginWork';
import { HostRoot } from './workTags';
import { NoFlags, MutationMask, PassiveMask, HostEffectMask, PassiveEffect, HookHasEffect } from './fiberFlags';
import { commitMutationEffects, commitLayoutEffects,commitHookEffectListUnmount, commitHookEffectListDestroy, commitHookEffectListCreate } from './commitwork';
import { Lane, NoLane, SyncLane, mergeLanes, markRootFinished, markRootSuspended } from './fiberLanes';
import { scheduleSyncCallback, flushSyncTaskQueue } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import { currentDispatcher } from 'react';
import {
    unstable_scheduleCallback as scheduleCallback,
    unstable_NormalPriority as NormalPriority,
    unstable_shouldYield,
    unstable_cancelCallback
} from 'scheduler';
import { lanesToSchedulerPriority,markRootPinged,getNextLane } from './fiberLanes';
import { resetHooksOnUnwind } from './fiberHooks';
import { setScheduler } from './scheduler';
import { SuspenseException, getSuspenseThenable } from './thenable';
import { throwException } from './fiberThrow';
import { unwindWork } from './fiberUnwindWork';


let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffect: Boolean = false;

type RootExitSratus = number
// 工作中的状态
const RootInProgress = 0;
// 并发中间状态
const RootInComplete = 1;
// 完成状态
const RootCompleted = 2;
// 未完成状态，不用进入commit阶段
const RootDidNotComplete = 3;

let wipRootExitStatus: RootExitSratus = RootInProgress;



type SuspendedReason = typeof NotSuspended | typeof SuspendedOnData | typeof SuspendedOnDeprecatedThrowPromise | typeof SuspendedOnError;
const NotSuspended = 0;
const SuspendedOnError = 1;
const SuspendedOnData = 2;
const SuspendedOnDeprecatedThrowPromise = 4;
let workInProgressSuspendedReason: SuspendedReason = NotSuspended;
let workInProgressThrownValue: any = null;


export function markRootUpdated(root: FiberRootNode, lane: Lane) {
    root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
    root.finishedLane = NoLane;
    root.finishedWork = null;
    workInProgress = createWorkInProgress(root.current, {}); // 设置当前工作中的Fiber节点
    wipRootRenderLane = lane;

    // 重置 Suspense 相关状态
    wipRootExitStatus = RootInProgress;
    workInProgressSuspendedReason = NotSuspended;
    workInProgressThrownValue = null;

    // 重置 dispatcher，确保每次渲染都从干净的状态开始
    currentDispatcher.current = null;
    
    // 设置 ping 回调函数
    root.onPing = (pingedLane: Lane) => {
        markRootUpdated(root, pingedLane);
        markRootPinged(root, pingedLane);
        ensureRootIsScheduled(root);
    };
}
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
    //调度功能
    const root = markUpdateFromFiberToRoot(fiber); // 标记从Fiber节点到根节点的更新
    markRootUpdated(root, lane);
    ensureRootIsScheduled(root); // 渲染根节点
}
export function ensureRootIsScheduled(root: FiberRootNode) {
    const updateLane = getNextLane(root);
    const exitingCallback = root.callbackNode;
    if (updateLane === NoLane) {
        if (exitingCallback !== null) {
            unstable_cancelCallback(exitingCallback);
        }
        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return;
    }
    const curPriority = updateLane
    const prevPriority = root.callbackPriority;
    if (prevPriority === curPriority) {
        return;
    }
    if (exitingCallback !== null) {
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
): any {
    //保证useEffect回调被执行
    const curCallback = root.callbackNode;
    const didFlushPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects);
    if (didFlushPassiveEffect) {
        if (root.callbackNode !== curCallback) {
            return null;
        }
    }
    const lane = getNextLane(root);
    const curCallbackNode = root.callbackNode;
    if (lane === NoLane) {
        ensureRootIsScheduled(root);
        return null;
    }
    const needSync = lane === SyncLane || didTimeOut;
    //render阶段
    const exitStatus = renderRoot(root, lane, !needSync);


    switch (exitStatus) {
        case RootInComplete:
            if (root.callbackNode !== curCallbackNode) {
                return null
            }
            return performSyncWorkOnRoot.bind(null, root);
        case RootCompleted:
            const finishedWork = root.current.alternate;
            root.finishedWork = finishedWork;
            root.finishedLane = lane;
            wipRootRenderLane = NoLane;
            commitRoot(root);
            break;
        case RootDidNotComplete:
            markRootSuspended(root, lane);
            wipRootRenderLane = NoLane;
            ensureRootIsScheduled(root);
            break;
        default:
            if (__DEV__) {
                console.error('还有未实现的并发更新结束状态');
            }
            break;
    }

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
            if (
                workInProgressSuspendedReason !== NotSuspended &&
                workInProgress !== null
            ) {
                const thrownValue = workInProgressThrownValue;

                workInProgressSuspendedReason = NotSuspended;
                workInProgressThrownValue = null;

                throwAndUnwindWorkLoop(root, workInProgress, thrownValue, lane);
            }

            shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
            break;
        } catch (e) {
            if (__DEV__) {
                console.warn('workLoop发生错误', e);
            }
            handleThrow(root, e);
        }
    } while (true);

    if (wipRootExitStatus !== RootInProgress) {
        return wipRootExitStatus;
    }

    // 中断执行
    if (shouldTimeSlice && workInProgress !== null) {
        return RootInComplete;
    }

    // 检查是否因为 Suspense 而中断
    if (workInProgress === null && (wipRootExitStatus as number) === RootDidNotComplete) {
        return RootDidNotComplete;
    }

    // render阶段执行完
    if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
        console.error('render阶段未完成,但workInProgress为null');
    }
    return RootCompleted;
}
function throwAndUnwindWorkLoop(
    root: FiberRootNode,
    unitOfWork: FiberNode,
    thrownValue: any,
    lane: Lane
) {
    // unwind前的重置hook，避免 hook0 use hook1 时 use造成中断，再恢复时前后hook对应不上
    resetHooksOnUnwind(unitOfWork);
    throwException(root, thrownValue, lane);
    unwindUnitOfWork(unitOfWork);
}
function unwindUnitOfWork(unitOfWork: FiberNode) {
    let incompleteWork: FiberNode | null = unitOfWork;
    do {
        const next = unwindWork(incompleteWork);

        if (next !== null) {
            next.flags &= HostEffectMask;
            workInProgress = next;
            return;
        }

        const returnFiber = incompleteWork.return as FiberNode;
        if (returnFiber !== null) {
            returnFiber.deletions = null;
        }
        incompleteWork = returnFiber;
        // workInProgress = incompleteWork;
    } while (incompleteWork !== null);

    // 没有 边界 中止unwind流程，一直到root
    wipRootExitStatus = RootDidNotComplete;
    workInProgress = null;
}


function handleThrow(root: FiberRootNode, thrownValue: any): void {
    /*
        throw可能的情况
            1. use thenable
            2. error (Error Boundary处理)
    */
    if (thrownValue === SuspenseException) {
        workInProgressSuspendedReason = SuspendedOnData;
        thrownValue = getSuspenseThenable();
    } else {
        const isWakeable =
            thrownValue !== null &&
            typeof thrownValue === 'object' &&
            typeof thrownValue.then === 'function';

        workInProgressThrownValue = thrownValue;
        workInProgressSuspendedReason = isWakeable
            ? SuspendedOnDeprecatedThrowPromise
            : SuspendedOnError;
    }
    workInProgressThrownValue = thrownValue;
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
    const nextLane = getNextLane(root);
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

    switch (exitStatus) {
        case RootCompleted:
            const finishedWork = root.current.alternate
            root.finishedWork = finishedWork; // 设置完成的工作节点
            root.finishedLane = nextLane;
            wipRootRenderLane = NoLane;
            // 只有在 render 完成时才提交
            commitRoot(root);
            break;
        case RootDidNotComplete:
            wipRootRenderLane = NoLane;
            markRootSuspended(root, nextLane);
            ensureRootIsScheduled(root);
            break;
        default:
            if(__DEV__){
                console.error('还有未实现的同步更新结束状态');
            }
            break;
    }
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
        (finishedWork.flags & PassiveMask) !== NoFlags ||
        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
    ) {
        if (!rootDoesHasPassiveEffect) {
            rootDoesHasPassiveEffect = true;
            // 调度副作用
            scheduleCallback(NormalPriority, () => {
                // 执行副作用
                flushPassiveEffects(root.pendingPassiveEffects);
                return;
            });
        }
    }
    rootDoesHasPassiveEffect = false;
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