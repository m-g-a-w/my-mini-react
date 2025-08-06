import { FiberNode } from "./fiber";
export function renderWithHooks(wip: FiberNode){
    const Component = wip.type; // 获取组件类型
    const props = wip.pengingProps; // 获取待处理的属性
    const children = Component(props); // 调用组件函数获取子节点
    
    return children
}