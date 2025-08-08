import { FiberNode } from "react-reconciler/src/fiber";
import { HostText } from "react-reconciler/src/workTags";

export type Container = Element; // 容器类型，可以是DOM元素或其他容器
export type Instance = Element; // 容器类型，可以是DOM元素或其他容器
export type TextInstance = Text;

// export const createIns÷tance = (type: string,props: any): Instance => {
export const createInstance = (type: string): Instance => {
    
    const element = document.createElement(type); // 创建一个新的DOM元素
    return element; // 返回创建的DOM元素
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
    container.removeChild(child);
}