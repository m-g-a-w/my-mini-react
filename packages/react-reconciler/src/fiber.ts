import {Props,Key,Ref} from 'shared/ReactTypes'
import {WorkTag} from './workTags'
import {Flags,NoFlags} from './fiberFlags'

export class FiberNode {
    tag: WorkTag; // Fiber的类型
    key: Key; // 唯一标识符
    type: any; // 元素类型
    pengingProps: Props; // 待处理的属性
    return: FiberNode | null; // 指向父Fiber节点
    sibling: FiberNode | null; // 指向兄弟Fiber节点
    child: FiberNode | null; // 指向子Fiber节点
    index: number; // 在兄弟节点中的索引
    ref: Ref; // 引用
    
    memoizedProps: Props | null; // 已处理的属性
    alternate: FiberNode | null; // 用于在workinProgess与current两棵缓存树中进行切换
    flags: Flags; // 用于标记Fiber的状态，如更新、删除等

    constructor(tag: WorkTag,pengingProps: Props,key: Key){
        this.tag = tag; // Fiber的类型
        this.key = key; // 唯一标识符  
        this.type = null; // 元素类型   
        
        //树状结构
        this.return = null; // 指向父Fiber节点
        this.sibling = null; // 指向兄弟Fiber节点
        this.child = null; // 指向子Fiber节点
        this.index = 0; // 在兄弟节点中的索引
        this.ref = null; // 引用

        //作为工作单元
        this.pengingProps = pengingProps; // 待处理的属性
        this.memoizedProps = null; // 已处理的属性
        
        this.alternate = null; // 用于在workinProgess与current两棵缓存树中进行切换
        this.flags = NoFlags; //副作用 用于标记Fiber的状态，如更新、删除等
    }
}