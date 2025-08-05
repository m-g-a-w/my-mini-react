import { ReactElement } from "shared/ReactTypes";
import { Container } from "hostConfig";
import { createContainer, updateContainer } from "react-reconciler/src/fiberReconciler";

export function createRoot(container: Container) {
    const root = createContainer(container); // 创建根容器
    return {
        render(element:ReactElement){
            updateContainer(element, root); // 更新容器中的内容
        }
    };
}