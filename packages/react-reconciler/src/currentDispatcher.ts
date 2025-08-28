import { Action, ReactContext } from "../../shared/ReactTypes";
import { currentDispatcher } from 'react';

export interface Dispatcher {
    useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
    useEffect: (create: () => (() => void) | void, deps?: any[] | null) => void;
    useTransition: () => [boolean, (callback: () => void) => void];
    useRef: <T>(initialValue: T) => {current: T},
    useContext: <T>(context: ReactContext<T>) => T;

}

export type Dispatch<T> = (action: Action<T>) => void;

export interface BatchConfig {
    transition: number;
}

// 创建一个全局的 setter 函数
export function setGlobalCurrentDispatcher(dispatcher: { current: Dispatcher | null }) {
    // 将传入的 dispatcher 的 current 属性同步到全局实例
    Object.defineProperty(dispatcher, 'current', {
        get() {
            return currentDispatcher.current;
        },
        set(value) {
            currentDispatcher.current = value;
        }
    });
}

export function resolveDispatcher(): Dispatcher {
    const dispatcher = currentDispatcher.current;
    if (dispatcher === null) {
        throw new Error('Hooks can only be called inside the body of a function component.');
    }
    return dispatcher;
}

export default currentDispatcher; 