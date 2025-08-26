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