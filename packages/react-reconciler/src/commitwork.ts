import { Container,appendChildToContainer } from "hostConfig";
import { FiberNode } from "./fiber"
import { MutationMask, NoFlags, Placement } from "./fiberFlags";
import { HostComponent, HostRoot } from "./workTags";

let nextEffect: FiberNode | null = null; // 下一个副作用节点

export const commitMutationEffects = (finishedWork: FiberNode) => {
    nextEffect = finishedWork

    const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
        const flags = finishedWork.flags; // 获取当前Fiber节点的标记
        if ((flags & Placement) !== NoFlags) {
            //test时打印错误信息
            //way one
            // if (finishedWork.tag !== HostRoot) {
            //     commitPlacement(finishedWork);
            // }
            
            commitPlacement(finishedWork);
            finishedWork.flags &= ~Placement;
        }
    }

    function commitPlacement(finishedWork: FiberNode) {
        if (__DEV__) {
            console.warn('commitPlacement', finishedWork);
        }
        const hostParent = getHostParent(finishedWork); // 获取宿主父节点
        
        // 只有当hostParent不为null时才执行插入操作
        if (hostParent !== null) {
            appendPlacementNodeIntoContainer(finishedWork, hostParent); // 将节点插入到
        }
    };

    function getHostParent(fiber: FiberNode): Container | null {
        let parent = fiber.return; // 获取父节点
        while (parent) {
            const parentTag = parent.tag; // 获取父节点的类型
            if (parentTag === HostComponent) {
                return parent.stateNode as Container; // 如果父节点是HostComponent，返回其状态节点
            }
            if (parentTag === HostRoot) {
                return parent.stateNode.container as Container;
            }
            parent = parent.return; // 向上回溯到父节点
        }
        if (__DEV__) {
            console.warn('未找到HostParent')
        }
        return null; // 返回null而不是null as any
    }

    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child
        if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {

            nextEffect = child // 如果有子节点，继续处理子节点
        } else {
            //向上遍历
            up: while (nextEffect !== null) {
                commitMutationEffectsOnFiber(nextEffect); // 提交当前副作用节点的变更
                const sibling: FiberNode | null = nextEffect.sibling; // 获取兄弟节点
                if (sibling !== null) {
                    nextEffect = sibling; // 如果有兄弟节点，继续处理兄弟节点
                    break up; // 跳出循环，继续处理下一个副作用节点
                }
                nextEffect = nextEffect.return; // 如果没有兄弟节点，向上回溯到父节点
            }
        }
    }
}

function appendPlacementNodeIntoContainer(
    finishedWork: FiberNode,
    hostParent: Container
) {
    if(finishedWork.tag === HostComponent || finishedWork.tag === HostRoot) {
        appendChildToContainer(hostParent,finishedWork.stateNode);
        return
    }
    const child = finishedWork.child; // 获取子节点
    if(child !== null) {
        appendPlacementNodeIntoContainer(child, hostParent); // 递归处理子节点
        let sibling = child.sibling; // 获取兄弟节点
        while(sibling !== null) {
            appendPlacementNodeIntoContainer(sibling, hostParent); // 递归处理兄弟节点
            sibling = sibling.sibling; // 获取下一个兄弟节点
        }
    }
}