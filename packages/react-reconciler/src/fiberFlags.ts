
export type Flags = number;

export const NoFlags = 0b00000000; // 没有标记
export const Placement = 0b00000001; // 插入标记
export const Update = 0b00000010; // 更新标记
export const ChildDeletion = 0b00000100; // 子节点删除标记

export const PassiveEffect = 0b0001000;
export const HookHasEffect = 0b0010000;
export const Ref = 0b0100000;
export const Visibility = 0b1000000;

export const MutationMask =
	Placement | Update | ChildDeletion | Ref | Visibility
export const LayoutMask = Ref;
export const PassiveMask = PassiveEffect | ChildDeletion;

