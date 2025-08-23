import { ReactElement } from "../../shared/ReactTypes";
import { Container } from "./hostConfig";
import { createContainer, updateContainer } from "../../react-reconciler/src/fiberReconciler";
import { initEvent } from "./SyntheticEvent";   

export function createRoot(container: Container) {
    const root = createContainer(container); // 创建根容器
    return {
        render(element:ReactElement){
            // 确保容器存在且是有效的DOM元素
            if (container && container instanceof Element) {
                initEvent(container,'click')
            }
            updateContainer(element, root); // 更新容器中的内容
        }
    };
}