import { FiberNode } from "react-reconciler/src/fiber";
import { HostText,HostComponent } from "react-reconciler/src/workTags";
import { Props } from "shared/ReactTypes";
import { updateFiberProps,DOMElement } from "./SyntheticEvent";

export type Container = Element; // 容器类型，必须是DOM元素
export type Instance = Element; // 实例类型，必须是DOM元素
export type TextInstance = Text;

// export const createIns÷tance = (type: string,props: any): Instance => {
export const createInstance = (type: string,props: Props): Instance => {
    
    const element = document.createElement(type) as unknown; // 创建一个新的DOM元素
    updateFiberProps(element as DOMElement,props);
    return element as DOMElement; // 返回创建的DOM元素
}

export const appendInitialChild = (parent: Instance | Container,child: Instance) => {
    parent.appendChild(child); // 将子元素添加到父元素中
}
export const createTextInstance = (content: string) => {
    return document.createTextNode(content); // 创建一个文本节点
}
export const appendChildToContainer = appendInitialChild;

export const commitUpdate = (fiber: FiberNode) => {
    switch(fiber.tag){
        case HostText:
            const text = fiber.memoizedProps.content;
            return commitTextUpdate(fiber.stateNode,text);
        case HostComponent:
            return updateFiberProps(fiber.stateNode,fiber.memoizedProps);
        default:
            if(__DEV__){
                console.warn("未实现的update类型");
            }
            return;
    }
}

export function commitTextUpdate(textInstance: TextInstance,content: string){
    textInstance.textContent = content;
}
export const removeChild = (child: Instance | TextInstance,container: Container) => {
    if (child && container) {
        container.removeChild(child);
    }
}
export function insertChildToContainer(
    child: Instance,
    container: Container,
    before: Instance
){
    container.insertBefore(child,before);
}
export const scheduleMicroTask = typeof queueMicrotask === 'function' ?
 queueMicrotask
  : typeof Promise === 'function'
   ? (callback:(...args: any) => void) => Promise.resolve(null).then(callback) 
   : setTimeout; 
