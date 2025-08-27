import { createElement as createElementFn } from './src/jsx';

// 定义 Dispatcher 接口
export interface Dispatcher {
    useState: <T>(initialState: T | (() => T)) => [T, (action: T | ((prev: T) => T)) => void];
    useEffect: (create: () => (() => void) | void, deps?: any[] | null) => void;
    useTransition: () => [boolean, (callback: () => void) => void];
    useRef: <T>(initialValue: T) => { current: T };
}

// 创建全局的 currentDispatcher 实例
export const currentDispatcher: { current: Dispatcher | null } = {
    current: null
};

// 创建本地的 resolveDispatcher 函数
function resolveDispatcher(): Dispatcher {
    const dispatcher = currentDispatcher.current;
    if (dispatcher === null) {
        throw new Error('Hooks can only be called inside the body of a function component.');
    }
    return dispatcher;
}

// React
export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, deps);
};

export const useRef: Dispatcher['useRef'] = (initialValue) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useRef(initialValue);
};

export const useTransition: Dispatcher['useTransition'] = () => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useTransition();
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0';

// TODO 根据环境区分使用jsx/jsxDEV
export const createElement = createElementFn;