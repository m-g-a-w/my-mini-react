import { REACT_ELEMENT_TYPE,REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import type{ Type,Key, Ref,Props,ReactElement,ElementType } from 'shared/ReactTypes';

const ReactElement = function(type: Type,key: Key,ref: Ref,props: Props): ReactElement{
    const element = {
        $$typeof:REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props,
        __mark:'mgaw'//添加标识
    }
    return element
}
export const isValidElement = (object: any): boolean => {
    return (
        typeof object === 'object' &&
        object !== null &&
        object.$$typeof === REACT_ELEMENT_TYPE
    );
}   

export const jsx = (type: ElementType,config: any,...maybeChildren: any): ReactElement => {
    let key:Key = null;
    const props: Props = {};
    let ref: Ref = null;
    for(const prop in config){
        const val = config[prop];
        if(prop === 'key'){
            if(val !== undefined)key = '' + val
            continue;    
        } 
        if(prop === 'ref'){
            if(val !== undefined)ref = val;
            continue;
        }
        if({}.hasOwnProperty.call(config,prop)){//自己身上的而非原型上的
            props[prop] = val;
        }
    }
    const maybeChildrenLength = maybeChildren.length;
    if(maybeChildrenLength) {
        if(maybeChildrenLength === 1) {
            props.children = maybeChildren[0];
        } else {
            props.children = maybeChildren;
        }
    }   
    return ReactElement(type,key,ref,props);
}

export const createElement = jsx;
export const jsxDEV = (type: ElementType,config: any,...maybeChildren: any): ReactElement => {
    let key:Key = null;
    const props: Props = {};
    let ref: Ref = null;
    for(const prop in config){
        const val = config[prop];
        if(prop === 'key'){
            if(val !== undefined)key = '' + val
            continue;    
        } 
        if(prop === 'ref'){
            if(val !== undefined)ref = val;
            continue;
        }
        if({}.hasOwnProperty.call(config,prop)){//自己身上的而非原型上的
            props[prop] = val;
        }
    }
    const maybeChildrenLength = maybeChildren.length;
    if(maybeChildrenLength) {
        if(maybeChildrenLength === 1) {
            props.children = maybeChildren[0];
        } else {
            props.children = maybeChildren;
        }
    }
    return ReactElement(type,key,ref,props);
}

export const Fragment = REACT_FRAGMENT_TYPE