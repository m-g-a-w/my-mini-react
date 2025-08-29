import { FiberNode } from './fiber';
import { HostComponent,Fragment,HostRoot, HostText,FunctionComponent } from './workTags';
import { createInstance,appendInitialChild, Container, createTextInstance, Instance } from 'hostConfig';
import { NoFlags,Update,Ref,Visibility } from './fiberFlags';
import { popProvider } from './fiberContext';
import { ContextProvider,SuspenseComponent } from './workTags';
import { popSuspenseHandler } from './suspenseContext';

function markUpdate(wip: FiberNode){
    wip.flags |= Update;
}
function markRef(wip: FiberNode){
    wip.flags |= Ref;
}

export const completeWork = (wip: FiberNode) => {
    //递归中的归
    const newProps = wip.pendingProps; // 获取待处理的属性
    const current = wip.alternate; // 获取当前的备用节点
    switch (wip.tag) {
        case HostComponent:
            if(current !== null && wip.stateNode) {
                //update
                //判断props是否变化
                //如果变化则添加update tag
                markUpdate(wip);
                if(current.ref !== wip.ref){
                markRef(wip);
            }
            } else {
                //1.构建DOM
                const instance = createInstance(wip.type,newProps);
                //2.将DOM插入到DOM树中
                appendAllChildren(instance, wip); // 将子节点添加到实例中
                wip.stateNode = instance; // 将实例赋值给wip的stateNode
                if(wip.ref !== null){
                    markRef(wip);
                }
            }
            bubbleProperties(wip); // 处理子节点的属性
            return null;
        case HostText:
            if(current !== null && wip.stateNode) {
                //update
                const oldText = current.memoizedProps.content;
                const newText = newProps.content;
                if(oldText !== newText){
                    markUpdate(wip);
                }
            }
            else{
                //构建DOM
                const instance = createTextInstance(newProps.content);
                wip.stateNode = instance; // 将实例赋值给wip的stateNode
            }
            bubbleProperties(wip); // 处理子节点的属性
            return null;

        case HostRoot:
        case FunctionComponent:
        case Fragment:
            bubbleProperties(wip);
            return null; 
        case ContextProvider:
            const context = wip.type._context;
            popProvider(context)
            bubbleProperties(wip);
            return null;
        case SuspenseComponent:
            popSuspenseHandler();
            const offscreenFiber = wip.child as FiberNode;
            const isHidden = offscreenFiber.pendingProps.mode === 'hidden';
            const currentOffscreenFiber = offscreenFiber.alternate;

            if(currentOffscreenFiber !== null){
                const wasHidden = currentOffscreenFiber.pendingProps.mode === 'hidden';
                if(isHidden !== wasHidden){
                    offscreenFiber.flags |= Visibility;
                    bubbleProperties(offscreenFiber);
                }
            }else if(isHidden){
                offscreenFiber.flags |= Visibility;
                bubbleProperties(offscreenFiber);
            }
            bubbleProperties(wip);
            return null;
        default:
            if(__DEV__) {
                console.warn('未处理的workTag类型', wip.tag);
            }
            break;
    }
}

function appendAllChildren(
    parent: Container | Instance,
    wip: FiberNode
) {
    let node = wip.child;
    while(node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node?.stateNode);
        }else if(node.child !== null){
            node.child.return = node
            node = node.child
            continue
        }
        if(node === wip) {
            return
        }
        while(node.sibling === null) {
            if(node.return === null || node.return === wip){
                return
            }
            node = node?.return
        }
        node.sibling.return = node.return
        node = node.sibling
    }   
}
export function bubbleProperties(wip: FiberNode){
    let subtreeFlags = NoFlags
    let child = wip.child

    while(child !== null){
        subtreeFlags |= child.subtreeFlags
        subtreeFlags |= child.flags
        
        child.return = wip
        child = child.sibling
    }
    wip.subtreeFlags |= subtreeFlags

}