import { ReactContext } from "shared/ReactTypes";
import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from "shared/ReactSymbols";

export function createContext<T>(defaultValue: T): ReactContext<T> {
    const context: ReactContext<T> = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null as any, // 临时设置为 any，稍后更新
        _currentValue: defaultValue,
    };
    
    // 设置 Provider，避免循环引用
    const provider = {
        $$typeof: REACT_PROVIDER_TYPE,
        _context: context,
    } as any;
    
    // 添加函数调用能力
    (provider as any).__proto__ = Function.prototype;
    
    context.Provider = provider;
    
    return context;
}


