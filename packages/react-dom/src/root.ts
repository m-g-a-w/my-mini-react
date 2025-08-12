import { ReactElement } from "shared/ReactTypes";
import { Container } from "hostConfig";
import { createContainer, updateContainer } from "react-reconciler/src/fiberReconciler";
import { initEvent } from "./SyntheticEvent";   

export function createRoot(container: Container) {
    const root = createContainer(container); // 创建根容器
    return {
        render(element:ReactElement){
            initEvent(container,'click')
            updateContainer(element, root); // 更新容器中的内容
        }
    };
}