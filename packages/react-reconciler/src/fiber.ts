import { Props, Key, Ref, ReactElement } from 'shared/ReactTypes';
import { WorkTag, FunctionComponent, HostComponent, Fragment } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { Container } from 'hostConfig';
import type { CallbackNode } from 'scheduler';

export class FiberNode {
    tag: WorkTag; // Fiber的类型
    key: Key; // 唯一标识符
    type: any; // 元素类型
    ref: Ref; // 引用
    stateNode: any; // 关联的DOM节点或组件实例

    pendingProps: Props; // 待处理的属性
    return: FiberNode | null; // 指向父Fiber节点
    sibling: FiberNode | null; // 指向兄弟Fiber节点
    child: FiberNode | null; // 指向子Fiber节点
    index: number; // 在兄弟节点中的索引
    
    memoizedProps: Props | null; // 已处理的属性
    memoizedState: any; // 已处理的状态
    alternate: FiberNode | null; // 用于在workinProgess与current两棵缓存树中进行切换
    flags: Flags; // 用于标记Fiber的状态，如更新、删除等
    subtreeFlags: Flags; // 子树的标记，用于标记子节点的状态
    updateQueue: any; // 更新队列，用于存储待处理的更新
    deletions: FiberNode[] | null

    constructor(tag: WorkTag,pendingProps: Props,key: Key){
        this.tag = tag; // Fiber的类型
        this.key =  key || null; // 唯一标识符  
        this.type = null; // 元素类型   
        
        //树状结构
        this.return = null; // 指向父Fiber节点
        this.sibling = null; // 指向兄弟Fiber节点
        this.child = null; // 指向子Fiber节点
        this.index = 0; // 在兄弟节点中的索引
        this.ref = null; // 引用

        //作为工作单元
        this.pendingProps = pendingProps; // 待处理的属性
        this.memoizedProps = null; // 已处理的属性
        this.memoizedState = null; // 已处理的状态
        this.updateQueue = null; // 更新队列，用于存储待处理的更新
        
        this.alternate = null; // 用于在workinProgess与current两棵缓存树中进行切换
        //副作用
        this.flags = NoFlags; //用于标记Fiber的状态，如更新、删除等
        this.subtreeFlags = NoFlags; // 子树的标记，用于标记子节点的状态
        this.deletions = null
    }
}
export class FiberRootNode{
    container: Container; // 容器信息
    current: FiberNode; // 当前的Fiber节点
    pendingLanes: Lanes; // 待处理的更新队列
    finishedLane: Lane; // 已完成的更新队列
    finishedLanes: Lanes; // 已完成的更新队列
    finishedWork: FiberNode | null; // 完成的Fiber节点
    suspendedLanes: Lanes; // 挂起的lanes
    pingedLanes: Lanes; // 被ping的lanes
    pendingPassiveEffects: PendingPassiveEffects // 待处理的副作用
    callbackNode: CallbackNode | null; // 回调节点
    callbackPriority: Lane; // 回调节点优先级
    constructor(container: Container, hostRootFiber:FiberNode) {
        this.container = container; // 容器信息
        this.current = hostRootFiber; // 当前的Fiber节点
        hostRootFiber.stateNode = this;
        this.finishedWork = null; // 完成的Fiber节点，初始为null
        this.pendingLanes = NoLanes; // 待处理的更新队列
        this.finishedLane = NoLane; // 已完成的更新队列
        this.finishedLanes = NoLanes; // 已完成的更新队列
        this.suspendedLanes = NoLanes; // 挂起的lanes
        this.pingedLanes = NoLanes; // 被ping的lanes
        this.pendingPassiveEffects = {
            unmount: [],
            update: []
        }
        this.callbackNode = null; // 回调节点
        this.callbackPriority = NoLane; // 回调节点优先级
    }
}
export interface PendingPassiveEffects{
    unmount: Effect[];
    update: Effect[];
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
        wip.pendingProps = pendingProps; // 更新备用节点的待处理属性
        wip.flags = NoFlags; // 重置备用节点的标记
        wip.subtreeFlags = NoFlags
        wip.deletions = null
    }
    wip.type = current.type; // 确保备用节点的类型与当前节点一致
    wip.updateQueue = current.updateQueue; // 继承当前节点的更新队列
    wip.child = current.child; // 继承当前节点的子节点
    wip.memoizedProps = current.memoizedProps; // 继承当前节点的已处理属性
    wip.memoizedState = current.memoizedState; // 继承当前
    return wip; // 返回备用节点
}
export const createFiberFromElement = (element: ReactElement): FiberNode => {
    const { type, key, props } = element; // 解构React元素的类型、键和属性
    let fiberTag: WorkTag;
    
    if (typeof type === 'string') {
        fiberTag = HostComponent; // 如果类型是字符串，设置为HostComponent 
    } else if (typeof type === 'function') {
        fiberTag = FunctionComponent; // 如果类型是函数，设置为FunctionComponent
    } else {
        if (__DEV__) {
            console.warn('createFiberFromElement未实现的类型:', type);
        }
        fiberTag = FunctionComponent; // 默认设置为FunctionComponent
    }
    
    const fiber = new FiberNode(fiberTag, props, key); // 创建新的Fiber节点
    fiber.type = type; // 设置Fiber节点的类型
    return fiber; // 返回创建的Fiber节点
}

export const createFiberFromFragment = (elements: any[], key: Key): FiberNode => {
    const fiber = new FiberNode(Fragment, elements, key);
    // fiber.type = Fragment;
    return fiber;
}