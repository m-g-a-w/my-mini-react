import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { FiberNode,createFiberFromElement } from './fiber';
import { ReactElement } from 'shared/ReactTypes';
import {HostText} from './workTags';
import { Placement } from './fiberFlags';

function ChildReconciler(shouldTrackSideEffects: boolean) {
    function reconcileSingleElement(
        returnFiber:FiberNode,
        currentFiber:FiberNode | null,
        element: ReactElement){
            const fiber = createFiberFromElement(element); // 创建新的Fiber节点
            fiber.return = returnFiber; // 设置父节点
            return fiber; // 返回新的Fiber节点
        }
    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        content: string | number
    ){
        const fiber = new FiberNode(HostText, {content},null); // 创建文本节点的Fiber节点
        fiber.return = returnFiber; // 设置父节点
        return fiber; // 返回新的Fiber节点
    }
    function placeSingleChild(fiber: FiberNode) {
        if(shouldTrackSideEffects && fiber.alternate === null) {
            fiber.flags |= Placement; // 标记为需要插入
        }
        return fiber; // 返回单个子节点的Fiber节点

    }
    return function reconcileChildFibers(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: ReactElement
    ){
        if(typeof newChild === 'object' && typeof newChild !== null) {
            switch(newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild));
                default:
                    if(__DEV__) {
                        console.warn('reconcileChildFibers未实现的类型');
                    }
                break;
            }
        }
        //多节点的情况
        //HostRoot
        if(typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild));
        }

        return null
    };
}
export const reconcileChildFibers = ChildReconciler(true); // 默认开启副作用跟踪
export const mountChildFibers = ChildReconciler(false); // 默认开启副作用跟踪

