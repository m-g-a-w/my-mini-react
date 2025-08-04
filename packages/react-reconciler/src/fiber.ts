import {Props,Key,Ref} from 'shared/ReactTypes'
import {WorkTag} from './workTags'
import {Flags,NoFlags} from './fiberFlags'
import {Container} from 'hostConfig'


export class FiberNode {
    tag: WorkTag; // Fiber的类型
    key: Key; // 唯一标识符
    type: any; // 元素类型
    ref: Ref; // 引用
    stateNode: any; // 关联的DOM节点或组件实例

    pengingProps: Props; // 待处理的属性
    return: FiberNode | null; // 指向父Fiber节点
    sibling: FiberNode | null; // 指向兄弟Fiber节点
    child: FiberNode | null; // 指向子Fiber节点
    index: number; // 在兄弟节点中的索引
    
    memoizedProps: Props | null; // 已处理的属性
    memoiszedState: any; // 已处理的状态
    alternate: FiberNode | null; // 用于在workinProgess与current两棵缓存树中进行切换
    flags: Flags; // 用于标记Fiber的状态，如更新、删除等
    updateQueue: any; // 更新队列，用于存储待处理的更新

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
        this.memoiszedState = null; // 已处理的状态
        this.updateQueue = null; // 更新队列，用于存储待处理的更新
        
        this.alternate = null; // 用于在workinProgess与current两棵缓存树中进行切换
        //副作用
        this.flags = NoFlags; //用于标记Fiber的状态，如更新、删除等
    }
}
export class FiberRootNode{
    container: Container; // 容器信息
    current: FiberNode; // 当前的Fiber节点
    finishedWork: FiberNode | null; // 完成的Fiber节点
    constructor(container: Container, hostRootFiber:FiberNode) {
        this.container = container; // 容器信息
        this.current = hostRootFiber; // 当前的Fiber节点
        hostRootFiber.stateNode = this;
        this.finishedWork = null; // 完成的Fiber节点，初始为null
    }
}
export const createWorkInProgress = (current: FiberNode, pendingProps: Props): FiberNode => {
    let wip = current.alternate; // 获取当前Fiber节点的备用节点
    if (wip === null) {
        //mount
        wip = new FiberNode(current.tag, pendingProps, current.key); // 如果备用节点不存在，创建一个新的Fiber节点
        wip.type = current.type; // 设置备用节点的类型
        wip.stateNode = current.stateNode; // 关联状态节点
        wip.alternate = current; // 设置备用节点的alternate指向当前节点
        current.alternate = wip; // 设置当前节点的alternate指向备用节点
    }else{
        //update
        wip.pengingProps = pendingProps; // 更新备用节点的待处理属性
        wip.flags = NoFlags; // 重置备用节点的标记
    }
    wip.type = current.type; // 确保备用节点的类型与当前节点一致
    wip.updateQueue = current.updateQueue; // 继承当前节点的更新队列
    wip.child = current.child; // 继承当前节点的子节点
    wip.memoizedProps = current.memoizedProps; // 继承当前节点的已处理属性
    wip.memoiszedState = current.memoiszedState; // 继承当前
    return wip; // 返回备用节点
}