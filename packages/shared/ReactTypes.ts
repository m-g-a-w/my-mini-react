export type Type = any;
export type Key = any;
export type Ref = {current: any} | ((instance: any) => void) | null;
export type Props = any;
export type ReactType = any;
export type ElementType = any;
export type ReactElementType = any;
export interface ReactElement {
    $$typeof: symbol | number; // 用于标识React元素类型
    type: ElementType; // 元素类型
    key: string | null; // 唯一标识符
    ref: any; // 引用
    props: any; // 属性
    __mark?: string; // 可选的标记字段
};
export type Action<State> = State | ((prevState: State) => State); // 更新动作


export type ReactContext<T> = {
    $$typeof: Symbol | number;
    Provider: ReactProviderType<T>;
    _currentValue: T;
}
export type ReactProviderType<T> = {
    $$typeof: Symbol | number;
    _context: ReactContext<T>;
} & {
    // 添加 JSX 组件所需的属性
    (props: { value: T; children?: any }): any;
}
export type Usable<T> = Thenable<T> | ReactContext<T>;

//untracked
//pending
//fulfilled -> resolve
//rejected -> reject
// export type Thenable
export interface Wakeable<Result>{
    then(
        onfulfilled: () => Result,
         onrejected: () => Result
    ): void | Wakeable<Result>
}

export type ThenableImp<T,Result,Err> = {
    then(
        onfulfilled: (value: T) => Result, 
        onrejected: (error: Err) => Result
    ):void | Wakeable<Result>
}

export interface UntrackedThenable<T,Result,Err> extends ThenableImp<T,Result,Err> {
    status?:void
}

export interface PendingThenable<T,Result,Err> extends ThenableImp<T,Result,Err> {
    status: 'pending'
}

export interface FulfilledThenable<T,Result,Err> extends ThenableImp<T,Result,Err> {
    status: 'fulfilled'
    value: T
}

export interface RejectedThenable<T,Result,Err> extends ThenableImp<T,Result,Err> {
    status: 'rejected'
    reason: Err
}
export type Thenable<T,Result = void,Err = any> = 
UntrackedThenable<T,Result,Err> 
| PendingThenable<T,Result,Err> 
| FulfilledThenable<T,Result,Err> 
| RejectedThenable<T,Result,Err>