import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { FiberNode, createFiberFromElement, createWorkInProgress } from './fiber';
import { ReactElement,Props } from 'shared/ReactTypes';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackSideEffects: boolean) {
    function deleteChild(returnFiber: FiberNode,childToDelete: FiberNode){
        if(!shouldTrackSideEffects)return
        const deletions = returnFiber.deletions
        if(deletions === null){
            returnFiber.deletions = [childToDelete]
            returnFiber.flags |= ChildDeletion
        }else{
            deletions.push(childToDelete)
        }
    }
    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        element: ReactElement) {
        const key = element.key
        work: if(currentFiber !== null){
            //update
            if(currentFiber.key === key){
                //key相同
                if(element.$$typeof === REACT_ELEMENT_TYPE){
                    if(currentFiber.type === element.type){
                        //type相同
                        const existing = useFiber(currentFiber,element.props)
                        existing.return = returnFiber
                        return existing;
                    }
                    //key不同，删除旧的
                    deleteChild(returnFiber,currentFiber)
                    break work;
                }else{
                    if(__DEV__){
                        console.warn('还未实现的react类型',element)
                        break work;
                    }
                }
            }else{
                //删掉旧的
                deleteChild(returnFiber,currentFiber)
            }
        }
        const fiber = createFiberFromElement(element); // 创建新的Fiber节点
        fiber.return = returnFiber; // 设置父节点
        return fiber; // 返回新的Fiber节点
    }
    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        content: string | number
    ) {
        if(currentFiber !== null){
            //update
            if(currentFiber.tag === HostText){
                //类型没变，复用旧的
                const existing = useFiber(currentFiber,{content})
                existing.return = returnFiber
                return existing;
            }
            //类型变了，删除旧的
            deleteChild(returnFiber,currentFiber)
        }
        const fiber = new FiberNode(HostText, { content }, null); // 创建文本节点的Fiber节点
        fiber.return = returnFiber; // 设置父节点
        return fiber; // 返回新的Fiber节点
    }
    function placeSingleChild(fiber: FiberNode) {
        if (shouldTrackSideEffects && fiber.alternate === null) {
            fiber.flags |= Placement; // 标记为需要插入
        }
        return fiber; // 返回单个子节点的Fiber节点
    }

    function reconcileChildrenArray(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        newChildren: any[]
    ): FiberNode | null {
        let resultingFirstChild: FiberNode | null = null;
        let previousNewFiber: FiberNode | null = null;
        let oldFiber = currentFirstChild;
        let newIdx = 0;
        let nextOldFiber = null;

        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            nextOldFiber = oldFiber.sibling;
            const newChild = newChildren[newIdx];
            const newFiber: FiberNode | null = reconcileChildFibers(returnFiber, oldFiber, newChild);
            
            if (newFiber === null) {
                if (oldFiber !== null) {
                    deleteChild(returnFiber, oldFiber);
                }
            } else {
                if (shouldTrackSideEffects) {
                    if (oldFiber && newFiber.alternate === null) {
                        newFiber.flags |= Placement;
                    }
                }
                
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
                oldFiber = nextOldFiber;
            }
        }

        // 删除剩余的旧fiber
        while (oldFiber !== null) {
            deleteChild(returnFiber, oldFiber);
            oldFiber = oldFiber.sibling;
        }

        // 添加剩余的新fiber
        for (; newIdx < newChildren.length; newIdx++) {
            const newChild = newChildren[newIdx];
            const newFiber: FiberNode | null = reconcileChildFibers(returnFiber, null, newChild);
            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    newFiber.flags |= Placement;
                }
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
            }
        }

        return resultingFirstChild;
    }
    return function reconcileChildFibers(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: ReactElement
    ): FiberNode | null {
        if (__DEV__) {
            console.log('reconcileChildFibers - newChild:', newChild);
            console.log('reconcileChildFibers - newChild type:', typeof newChild);
            console.log('reconcileChildFibers - newChild $$typeof:', newChild?.$$typeof);
        }
        
        // 处理 null/undefined 的情况
        if (newChild === null || newChild === undefined) {
            if(currentFiber !== null){
                deleteChild(returnFiber,currentFiber)
            }
            return null;
        }
        
        if (typeof newChild === 'object') {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild));
                default:
                    if (__DEV__) {
                        console.warn('reconcileChildFibers未实现的类型', newChild);
                    }
                    break;
            }
        }
        
        // 处理数组类型
        if (Array.isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFiber, newChild);
        }
        
        // 处理文本节点
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            const fiber = reconcileSingleTextNode(returnFiber, currentFiber, newChild);
            if(fiber !== null){
                return placeSingleChild(fiber);
            }
            return null;
        }
        
        // 处理其他情况
        if(currentFiber !== null){
            deleteChild(returnFiber,currentFiber)
        }
        return null
    };
}
export const reconcileChildFibers = ChildReconciler(true); // 默认开启副作用跟踪
export const mountChildFibers = ChildReconciler(false); // 默认开启副作用跟踪

function useFiber(fiber: FiberNode,pendingProps: Props):FiberNode{
    const clone = createWorkInProgress(fiber,pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
}