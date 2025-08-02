export type Flags = number;

export const NoFlags = 0b00000001; // 没有标记
export const Placement = 0b00000010; // 插入标记
export const Update = 0b00000100; // 更新标记
export const ChildDeletion = 0b00001000; // 子节点删除标记