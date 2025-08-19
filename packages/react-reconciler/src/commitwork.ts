import { Container, appendChildToContainer, commitUpdate,removeChild, Instance, insertChildToContainer } from "hostConfig";
import { FiberNode } from "./fiber"
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from "./fiberFlags";
import { HostComponent, HostRoot, FunctionComponent, HostText } from "./workTags";


let nextEffect: FiberNode | null = null; // 下一个副作用节点

export const commitMutationEffects = (finishedWork: FiberNode) => {
    nextEffect = finishedWork

    const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
        const flags = finishedWork.flags; // 获取当前Fiber节点的标记
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
                deletions.forEach(ChildDeletion => {
                    commitDeletion(ChildDeletion);
                })
            }
            finishedWork.flags &= ~ChildDeletion;
        }
    }
    function recordHostChildrenToDelete(
        childrenToDelete: FiberNode[],
        unmountFiber: FiberNode){
        //1.找到第一个root host节点
        let lastOne = childrenToDelete[childrenToDelete.length - 1]
        if(!lastOne){
            childrenToDelete.push(unmountFiber)
        }else{
            let node = lastOne.sibling
            while(node !== null){
                if(unmountFiber === node){
                    childrenToDelete.push(unmountFiber)
                }
                node = node.sibling
            }
        }
        //2.每找到一个host节点，判断这个节点是不是找到那个节点的兄弟节点

    }
    function commitDeletion(childToDelete: FiberNode) {
        let rootChildrenToDelete: FiberNode[] = [];

        //递归子树
        commitNestedComponent(childToDelete, unmountFiber => {
            switch (unmountFiber.tag) {
                case HostComponent:
                    recordHostChildrenToDelete(rootChildrenToDelete,unmountFiber)
                    return;
                // case HostRoot:
                //     recordHostChildrenToDelete(rootChildrenToDelete,unmountFiber)
                //     return;
                case HostText:
                    recordHostChildrenToDelete(rootChildrenToDelete,unmountFiber)
                    return;
                case FunctionComponent:
                    //
                    return;
                default:
                    if(__DEV__){
                        console.warn("未实现的commitDeletion类型",unmountFiber.tag);
                    }
                    break;
            }
        });
        //移除rootHostNode的DOM
        if(rootChildrenToDelete.length){
            const hostParent = getHostParent(childToDelete);
            if (hostParent !== null) {
                rootChildrenToDelete.forEach(node => {
                    removeChild(node.stateNode, hostParent)
                })
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
                node.child.return = node;
                node = node.child;
                continue;
            }
            if (node === root) {
                return;
            }
            while (node.sibling === null) {
                if (node.return === null || node.return === root) {
                    return
                }
                node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }

    function commitPlacement(finishedWork: FiberNode) {
        if (__DEV__) {
            console.warn('commitPlacement', finishedWork);
        }
        const hostParent = getHostParent(finishedWork); // 获取宿主父节点

        // 只有当hostParent不为null时才执行插入操作
        if (hostParent !== null) {
            InsertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent); // 将节点插入到
        }
    }

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

    function InsertOrAppendPlacementNodeIntoContainer(
        finishedWork: FiberNode,
        hostParent: Container,
        before?:Instance
    ) {
        if (finishedWork.tag === HostComponent || finishedWork.tag === HostRoot) {
            if(before){
                insertChildToContainer(finishedWork.stateNode,hostParent,before);
            }else{
                appendChildToContainer(hostParent, finishedWork.stateNode);
            }
            return
        }
        const child = finishedWork.child; // 获取子节点
        if (child !== null) {
            InsertOrAppendPlacementNodeIntoContainer(child, hostParent); // 递归处理子节点
            let sibling = child.sibling; // 获取兄弟节点
            while (sibling !== null) {
                InsertOrAppendPlacementNodeIntoContainer(sibling, hostParent); // 递归处理兄弟节点
                sibling = sibling.sibling; // 获取下一个兄弟节点
            }
        }
    }
    function getHostSibling(fiber: FiberNode){
        let node: FiberNode = fiber;
        findSibling: while (true) {
            while(node.sibling === null){
                const parent = node.return;
                if(parent === null || parent.tag === HostComponent || parent.tag === HostRoot){
                    return null
                }
            }
            if (node.sibling) {
                node.sibling.return = node.return;
            }
            node = node.sibling;
            while(node.tag !== HostText && node.tag !== HostComponent){
                //向下遍历
                if((node.flags & Placement) !== NoFlags){
                    continue findSibling;
                }
                if(node.child === null){
                    continue findSibling;
                }else{
                    node.child.return = node.child;
                    node = node.child;
                }
            }
            if((node.flags & Placement) === NoFlags){
                return node.stateNode;
            }
        }
    }

    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child;
        if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
            nextEffect = child; // 如果有子节点，继续处理子节点
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