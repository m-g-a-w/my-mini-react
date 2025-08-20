import { Dispatch } from 'react/src/currentDispatcher'
import { Action } from 'shared/ReactTypes';
import { Lane } from './fiberLanes';

export interface Update<State>{
    action: Action<State>; // 更新动作
    next: Update<any> | null;
    lane: Lane;
}
export interface UpdateQueue<State> {
    shared:{
        pending: Update<State> | null; // 待处理的更新
    }
    dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(action: Action<State>,lane: Lane): Update<State> => {
    return {
        action,
        lane,
        next: null,
    };
}
export const createUpdateQueue = <State>() => {
    return {
        shared: {
            pending: null, // 初始化时没有待处理的更新
        },
        dispatch: null
    } as UpdateQueue<State>;
}
export const enqueueUpdate = <State>(
    updateQueue: UpdateQueue<State>, 
    update: Update<State>
) => {
    const pending =  updateQueue.shared.pending;
    if(pending === null){
        update.next = update;
    }else{
        update.next = pending.next;
        pending.next = update;
    }
    updateQueue.shared.pending = update;
}
export const processUpdateQueue = <State>(
    baseState: State, 
    pendingUpdate: Update<State> | null,
    renderLane: Lane
):{memoizedState:State} => {
    const result:ReturnType<typeof processUpdateQueue<State>> = { memoizedState: baseState }; // 初始化结果为基础状态
    if (pendingUpdate !== null) {
        let first = pendingUpdate.next
        let pending = pendingUpdate.next as Update<any>;
        do{
            const updateLane = pending.lane;
            if(updateLane === renderLane){
                const action = pending.action;
                if(action instanceof Function) {
                    baseState = action(baseState); // 如果action是函数，执行它并更新状态
                }else{
                    baseState = action; // 否则直接使用action作为新的状态
                }
            }else{
                if(__DEV__){
                    console.error('不应该进入updateLane !== renderLane逻辑')
                }
            }
            pending = pending.next as Update<State>;
        }while(pending !== first)
    }
    result.memoizedState = baseState;
    return result;
}