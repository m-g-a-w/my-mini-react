import { Action } from "../../shared/ReactTypes";

export interface Dispatcher {
    useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
    useEffect: (create: () => (() => void) | void, deps?: any[] | null) => void;
    useTransition: () => [boolean, (callback: () => void) => void],
    useRef: <T>(initialValue: T) => {current: T}
}

export type Dispatch<T> = (action: Action<T>) => void;

export interface BatchConfig {
    transition: number;
}

const currentDispatcher: { current: Dispatcher | null } = {
    current: null
};

const currentBatchConfig: BatchConfig = {
    transition: 0
};

export function resolveDispatcher(): Dispatcher {
    const dispatcher = currentDispatcher.current;
    if (dispatcher === null) {
        throw new Error('Hooks can only be called inside the body of a function component.');
    }
    return dispatcher;
}

export { currentBatchConfig };
export default currentDispatcher; 