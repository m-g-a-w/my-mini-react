import { ReactElement } from "shared/ReactTypes";
import { Container,Instance } from "./hostConfig";
import { createContainer, updateContainer } from "react-reconciler/src/fiberReconciler"; 
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";

let idCounter = 0;

export function createRoot() {
    const container: Container = {
        rootId:idCounter++,
        children:[],
    }
    function getChildren(parent:Container | Instance){
        if(parent){
            return parent.children;
        }
        return null
    }
    // @ts-ignore
    const root = createContainer(container); // 创建根容器
    function getChildrenAsJSX(root: Container){
        const children = childToJSX(getChildren(root))
        if(Array.isArray(children)){
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: REACT_FRAGMENT_TYPE,
                key: null,
                ref: null,
                props: {children},
                __mark: 'mgaw'
            }
        }
        return children
    }

    function childToJSX(child:any):any{
        if(typeof child === 'string' || typeof child === 'number'){
            return child;
        }
        if(Array.isArray(child)){
            if(child.length === 0){
                return null;
            }
            if(child.length === 1){
                return childToJSX(child[0]);
            }
            const children = child.map(childToJSX);
            if(
                children.every(
                    child =>typeof child === 'string'
                    || typeof child === 'number')
                ){
                return children.join('');
            }
            return children;
        }
        if(Array.isArray(child.children)){
            const instance:Instance = child
            const children = childToJSX(instance.children)
            const props = instance.props
            if(children !== null){
                props.children = children
            }
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: instance.type,
                key: null,
                ref: null,
                props,
                __mark: 'mgaw'
            }
        }
        //TextInstance
        return child.text
    }

    return {
        render(element:ReactElement){
            updateContainer(element, root); // 更新容器中的内容
        },
        getChildren(){
            return getChildren(container);
        },
        getChildrenAsJSX(){
            return getChildrenAsJSX(container);
        }
    };
}