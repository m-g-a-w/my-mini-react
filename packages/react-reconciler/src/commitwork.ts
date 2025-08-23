import { Container, Instance } from "../../shared/ReactHostConfig";
import { appendChildToContainer, commitUpdate, removeChild, insertChildToContainer } from "../../react-dom/src/hostConfig";
import { ChildDeletion, MutationMask, NoFlags, Placement, Update,PassiveEffect, HookHasEffect, Flags } from "./fiberFlags";
import { HostComponent, HostRoot, FunctionComponent, HostText } from "./workTags";
import { FiberRootNode,FiberNode, PendingPassiveEffects } from "./fiber";
import { Effect, FCUpdateQueue } from "./fiberHooks";

let nextEffect: FiberNode | null = null;

export const commitEffects = (
    phrase: 'mutation' | 'layout',
    mask: Flags,
    callback: (fiber: FiberNode, root: FiberRootNode) => void
) => {
    return (finishedWork: FiberNode, root: FiberRootNode) => {
        nextEffect = finishedWork;
        while (nextEffect !== null) {
            // 向下遍历
            const child: FiberNode | null = nextEffect.child;

            if ((nextEffect.subtreeFlags & (MutationMask | PassiveEffect)) !== NoFlags && child !== null) {
                nextEffect = child;
            } else {
                // 向上遍历 DFS
                up: while (nextEffect !== null) {
                    callback(nextEffect, root);
                    const sibling: FiberNode | null = nextEffect.sibling;

                    if (sibling !== null) {
                        nextEffect = sibling;
                        break up;
                    }
                    nextEffect = nextEffect.return;
                }
            }
        }
    };
};

const commitMutationEffectsOnFiber = (
    finishedWork: FiberNode,
    root: FiberRootNode
) => {
    const { flags, tag } = finishedWork;
    const current = finishedWork.alternate;

    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
    if ((flags & Update) !== NoFlags) {
        commitUpdate(finishedWork);
        finishedWork.flags &= ~Update;
    }
    if ((flags & ChildDeletion) !== NoFlags) {
        const deletions = finishedWork.deletions;
        if (deletions !== null) {
            deletions.forEach((childToDelete) => {
                commitDeletion(childToDelete, root);
            });
        }
        finishedWork.flags &= ~ChildDeletion;
    }
    if ((flags & PassiveEffect) !== NoFlags) {
        // 收集回调
        commitPassiveEffect(finishedWork, root, 'update');
        finishedWork.flags &= ~PassiveEffect;
    }
};

const commitLayoutEffectsOnFiber = (
    finishedWork: FiberNode,
    root: FiberRootNode
) => {
    const { flags, tag } = finishedWork;

    if ((flags & PassiveEffect) !== NoFlags) {
        // 收集回调
        commitPassiveEffect(finishedWork, root, 'update');
        finishedWork.flags &= ~PassiveEffect;
    }
};

export const commitMutationEffects = commitEffects(
    'mutation',
    MutationMask,
    commitMutationEffectsOnFiber
);

export const commitLayoutEffects = commitEffects(
    'layout',
    MutationMask,
    commitLayoutEffectsOnFiber
);

function commitPassiveEffect(
    fiber: FiberNode,
    root: FiberRootNode,
    type: keyof PendingPassiveEffects
) {
    if (fiber.tag !== FunctionComponent ||
        (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
    ) {
        return;
    }
    
    const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
    if (updateQueue !== null && updateQueue.lastEffect !== null) {
        
        if (type === 'unmount') {
            // 对于unmount类型，推入整个effect链表
            if (updateQueue.lastEffect !== null) {
                // 遍历整个effect链表，推入所有effects
                const lastEffect = updateQueue.lastEffect;
                const firstEffect = lastEffect.next;
                if (firstEffect !== null) {
                    let effect = firstEffect;
                    do {
                        root.pendingPassiveEffects.unmount.push(effect);
                        effect = effect.next as Effect;
                    } while (effect !== firstEffect);
                }
            }
        } else if (type === 'update') {
            // 对于update类型，检查是否有需要执行的effects
            const lastEffect = updateQueue.lastEffect;
            const firstEffect = lastEffect.next;
            if (firstEffect !== null) {
                let hasEffectToExecute = false;
                let effect = firstEffect;
                do {
                    if ((effect.tag & HookHasEffect) !== NoFlags) {
                        hasEffectToExecute = true;
                        break;
                    }
                    const nextEffect = effect.next;
                    if (nextEffect !== null) {
                        effect = nextEffect;
                    } else {
                        break;
                    }
                } while (effect !== firstEffect);
                
                // 只有当有需要执行的effect时，才推入lastEffect
                if (hasEffectToExecute) {
                    root.pendingPassiveEffects.update.push(lastEffect);
                }
            }
        }
    }
}

function recordHostChildrenToDelete(
    childrenToDelete: FiberNode[],
    unmountFiber: FiberNode
) {
    // 1. 找到第一个root host节点
    const lastOne = childrenToDelete[childrenToDelete.length - 1];

    if (!lastOne) {
        childrenToDelete.push(unmountFiber);
    } else {
        let node = lastOne.sibling;
        while (node !== null) {
            if (unmountFiber === node) {
                childrenToDelete.push(unmountFiber);
            }
            node = node.sibling;
        }
    }
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
    const rootChildrenToDelete: FiberNode[] = [];

    // 递归子树
    commitNestedComponent(childToDelete, (unmountFiber) => {
        switch (unmountFiber.tag) {
            case HostComponent:
                recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
                return;
            case HostText:
                recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
                return;
            case FunctionComponent:
                commitPassiveEffect(unmountFiber, root, 'unmount');
                return;
            default:
                if (__DEV__) {
                    console.warn('未处理的unmount类型', unmountFiber);
                }
        }
    });

    // 移除rootHostComponent的DOM
    if (rootChildrenToDelete.length) {
        const hostParent = getHostParent(childToDelete);
        if (hostParent !== null) {
            rootChildrenToDelete.forEach((node) => {
                removeChild(node.stateNode, hostParent);
            });
        }
    }
    childToDelete.return = null;
    childToDelete.child = null;
}

function commitNestedComponent(
    root: FiberNode,
    onCommitUnmount: (fiber: FiberNode) => void
) {
    let node = root;
    while (true) {
        onCommitUnmount(node);

        if (node.child !== null) {
            // 向下遍历
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === root) {
            // 终止条件
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === root) {
                return;
            }
            // 向上归
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

const commitPlacement = (finishedWork: FiberNode) => {
    if (__DEV__) {
        console.warn('执行Placement操作', finishedWork);
    }
    // parent DOM
    const hostParent = getHostParent(finishedWork);

    // host sibling
    const sibling = getHostSibling(finishedWork);

    // finishedWork ~~ DOM append parent DOM
    if (hostParent !== null) {
        insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
    }
};

function getHostSibling(fiber: FiberNode) {
    let node: FiberNode = fiber;

    findSibling: while (true) {
        while (node.sibling === null) {
            const parent = node.return;

            if (
                parent === null ||
                parent.tag === HostComponent ||
                parent.tag === HostRoot
            ) {
                return null;
            }
            node = parent;
        }
        node.sibling.return = node.return;
        node = node.sibling;

        while (node.tag !== HostText && node.tag !== HostComponent) {
            // 向下遍历
            if ((node.flags & Placement) !== NoFlags) {
                continue findSibling;
            }
            if (node.child === null) {
                continue findSibling;
            } else {
                node.child.return = node.return;
                node = node.child;
            }
        }

        if ((node.flags & Placement) === NoFlags) {
            return node.stateNode;
        }
    }
}

function getHostParent(fiber: FiberNode): Container | null {
    let parent = fiber.return;

    while (parent) {
        const parentTag = parent.tag;
        // HostComponent HostRoot
        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        }
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }
        parent = parent.return;
    }
    if (__DEV__) {
        console.warn('未找到host parent');
    }
    return null;
}

function insertOrAppendPlacementNodeIntoContainer(
    finishedWork: FiberNode,
    hostParent: Container,
    before?: Instance
) {
    // fiber host
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        if (before) {
            insertChildToContainer(finishedWork.stateNode, hostParent, before);
        } else {
            appendChildToContainer(hostParent, finishedWork.stateNode);
        }

        return;
    }
    
    // 对于函数组件等，递归处理子节点
    const child = finishedWork.child;
    if (child !== null) {
        insertOrAppendPlacementNodeIntoContainer(child, hostParent);
        let sibling = child.sibling;

        while (sibling !== null) {
            insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
            sibling = sibling.sibling;
        }
    }
}

function commitHookEffectList(
    flags: Flags,
    lastEffect: Effect,
    callback: (effect: Effect) => void
) {
    if (lastEffect === null) {
        return;
    }
    
    let effect = lastEffect.next as Effect;
    if (effect === null) {
        return;
    }

    do {
        if ((effect.tag & flags) === flags) {
            callback(effect);
        }
        effect = effect.next as Effect;
    } while (effect !== lastEffect.next);
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const destroy = effect.destroy;
        if (typeof destroy === 'function') {
            destroy();
        }
        effect.tag &= ~HookHasEffect;
    });
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const destroy = effect.destroy;
        if (typeof destroy === 'function') {
            destroy();
        }
    });
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const create = effect.create;
        if (typeof create === 'function') {
            const result = create();
            effect.destroy = result || undefined;
        }
    });
}