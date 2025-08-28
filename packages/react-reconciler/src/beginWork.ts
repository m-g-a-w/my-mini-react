import { createFiberFromOffscreen, FiberNode, OffscreenProps, createFiberFromFragment, createWorkInProgress } from "./fiber";
import { HostRoot, HostText, HostComponent, FunctionComponent, Fragment, ContextProvider, SuspenseComponent, OffscreenComponent } from "./workTags";
import { processUpdateQueue } from "./updateQueue";
import { ReactElement } from "../../shared/ReactTypes";
import { reconcileChildFibers, mountChildFibers } from "./childFibers";
import { renderWithHooks } from "./fiberHooks";
import { Lane } from "./fiberLanes";
import { ChildDeletion, Placement, Ref } from "./fiberFlags";
import { pushProvider } from "./fiberContext";


//递归中的递阶段
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
    //比较，返回子fiberNode
    switch (wip.tag) {
        case HostRoot:
            return updateHostRoot(wip, renderLane); // 更新根节点
        case HostComponent:
            return updateHostComponent(wip); // 更新组件节点
        case HostText:
            return null;
        case FunctionComponent:
            return updateFunctionComponent(wip, renderLane);
        case Fragment:
            return updateFragment(wip);
        case ContextProvider:
            return updateContextProvider(wip);
        case SuspenseComponent:
            return updateSuspenseComponent(wip);
        case OffscreenComponent:
            return updateOffscreenComponent(wip);
        default:
            if (__DEV__) {
                console.warn('beginWork未实现的类型');
            }
            break;
    }
    return null
}
function updateOffscreenComponent(wip: FiberNode) {
    const nextProps = wip.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(wip, nextChildren);
    return wip.child;

}
function updateSuspenseComponent(wip: FiberNode) {
    const current = wip.alternate;
    const nextProps = wip.pendingProps;

    let showFallback = false
    const didSuspend = true
    if (didSuspend) {
        showFallback = true
    }
    const nextPrimaryChildren = nextProps.children;
    const nextFallbackChildren = nextProps.fallback;
    if (current === null) {
        //mount
        if (showFallback) {
            //挂起
            return mountSuspenseFallbackChildren(
                wip,
                nextPrimaryChildren,
                nextFallbackChildren
            )
        } else {
            return mountSuspensePrimaryChildren(wip, nextPrimaryChildren)
        }
    } else {
        if (showFallback) {
            //挂起
            return updateSuspenseFallbackChildren(
                wip,
                nextPrimaryChildren,
                nextFallbackChildren
            )
        } else {
            //正常
            return updateSuspensePrimaryChildren(wip, nextPrimaryChildren)

        }
    }
}

function updateSuspensePrimaryChildren(
    wip: FiberNode,
    primaryChildren: any
) {
    const current = wip.alternate as FiberNode
    const currentPrimaryChildFragment = current.child as FiberNode
    const currentFallbackChildFragment: FiberNode | null = currentPrimaryChildFragment.sibling
    const primaryChildProps: OffscreenProps = {
        mode: 'visible',
        children: primaryChildren,
    }
    const primaryChildFragment = createWorkInProgress(
        currentPrimaryChildFragment,
        primaryChildProps
    )
    primaryChildFragment.return = wip;
    primaryChildFragment.sibling = null
    wip.child = primaryChildFragment;

    if (currentFallbackChildFragment !== null) {
        const deletions = wip.deletions
        if (deletions === null) {
            wip.deletions = [currentFallbackChildFragment]
            wip.flags |= ChildDeletion
        } else {
            deletions.push(currentFallbackChildFragment)
        }
        return null
    }
    return primaryChildFragment;
}
function updateSuspenseFallbackChildren(
    wip: FiberNode,
    primaryChildren: any,
    fallbackChildren: any
) {
    const current = wip.alternate as FiberNode
    const currentPrimaryChildFragment = current.child as FiberNode
    const currentFallbackChildFragment: FiberNode | null = currentPrimaryChildFragment.sibling

    const primaryChildProps: OffscreenProps = {
        mode: 'hidden',
        children: primaryChildren,
    }
    const primaryChildFragment = createWorkInProgress(currentPrimaryChildFragment, primaryChildProps)
    let fallbackChildFragment;
    if (currentFallbackChildFragment !== null) {
        fallbackChildFragment = createWorkInProgress(currentFallbackChildFragment, fallbackChildren)
    } else {
        fallbackChildFragment = createFiberFromFragment(fallbackChildren, null)
        fallbackChildFragment.flags |= Placement;
    }
    fallbackChildFragment.return = wip;
    primaryChildFragment.return = wip;
    primaryChildFragment.sibling = fallbackChildFragment;
    wip.child = primaryChildFragment;
    return fallbackChildFragment;
}
function mountSuspensePrimaryChildren(
    wip: FiberNode,
    primaryChildren: any
) {
    const primaryChildProps: OffscreenProps = {
        mode: 'visible',
        children: primaryChildren,
    }
    const primaryChildFragment = createFiberFromOffscreen(primaryChildProps)
    wip.child = primaryChildFragment;
    primaryChildFragment.return = wip;
    return primaryChildFragment;

}
function mountSuspenseFallbackChildren(
    wip: FiberNode,
    primaryChildren: any,
    fallbackChildren: any
) {
    const primaryChildProps: OffscreenProps = {
        mode: 'hidden',
        children: primaryChildren,
    }
    const primaryChildFragment = createFiberFromOffscreen(primaryChildProps)
    const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null)

    fallbackChildFragment.flags |= Placement;

    primaryChildFragment.return = wip;
    fallbackChildFragment.return = wip;
    primaryChildFragment.sibling = fallbackChildFragment;
    wip.child = primaryChildFragment;
    return fallbackChildFragment;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
    const nextChildren = renderWithHooks(wip, renderLane); // 使用钩子渲染组件
    reconcileChildren(wip, nextChildren); // 递归处理子节点
    return wip.child; // 返回子节点
}
function updateHostRoot(wip: FiberNode, renderLane: Lane) {
    const baseState = wip.memoizedState; // 获取基础状态
    const updateQueue = wip.updateQueue; // 获取更新队列
    const pending = updateQueue.shared.pending; // 获取待处理的更新
    updateQueue.shared.pending = null; // 清空待处理的更新
    const { memoizedState } = processUpdateQueue(baseState, pending, renderLane); // 处理更新队列
    wip.memoizedState = memoizedState; // 更新已处理状态

    const nextChildren = wip.memoizedState; // 获取待处理的子节点
    // 确保 nextChildren 不为 null，如果为 null 则使用空数组
    const children = nextChildren !== null ? nextChildren : [];
    reconcileChildren(wip, children); // 递归处理子节点
    return wip.child; // 返回子节点
}
function updateContextProvider(wip: FiberNode) {
    const providerType = wip.type;
    const context = providerType._context;
    const newProps = wip.pendingProps;
    const newValue = newProps.value;
    pushProvider(context, newValue);
    const nextChildren = newProps.children;
    reconcileChildren(wip, nextChildren);
    return wip.child;
}

function updateFragment(wip: FiberNode) {
    const nextChildren = wip.pendingProps; // 获取待处理的子节点
    reconcileChildren(wip, nextChildren); // 递归处理子节点
    return wip.child; // 返回子节点
}
function updateHostComponent(wip: FiberNode) {
    const nextProps = wip.pendingProps; // 获取待处理的属性
    const nextChildren = nextProps.children; // 获取待处理的子节点
    // 确保 nextChildren 不为 undefined，如果为 undefined 则使用 null
    markRef(wip.alternate, wip);
    const children = nextChildren !== undefined ? nextChildren : null;
    reconcileChildren(wip, children); // 递归处理子节点
    return wip.child; // 返回子节点
}
function reconcileChildren(wip: FiberNode, children?: ReactElement) {
    const current = wip.alternate; // 获取备用节点
    if (current !== null) {
        //update
        wip.child = reconcileChildFibers(wip, current?.child, children); // 更新子节点
    } else {
        wip.child = mountChildFibers(wip, null, children); // 创建新的子节点
    }
}

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
    const ref = workInProgress.ref;
    if ((current !== null && ref !== null) ||
        (current !== null && current.ref !== ref)) {
        workInProgress.flags |= Ref;
    }
}