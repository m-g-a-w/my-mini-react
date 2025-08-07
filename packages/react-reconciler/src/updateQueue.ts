import { Dispatch } from 'react';
import { Action } from 'shared/ReactTypes';

export interface Update<State>{
    action: Action<State>; // 更新动作
}
export interface UpdateQueue<State> {
    shared:{
        pending: Update<State> | null; // 待处理的更新
    }
    dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
    return {
        action,
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
export const enqueueUpdate = <State>(updateQueue: UpdateQueue<State>, update: Update<State>) => {
    updateQueue.shared.pending = update; // 将更新添加到待处理队列中
}
export const processUpdateQueue = <State>(baseState: State, pendingUpdate: Update<State> | null):{memoizedState:State} => {
    const result:ReturnType<typeof processUpdateQueue<State>> = { memoizedState: baseState }; // 初始化结果为基础状态
    if (pendingUpdate !== null) {
        const action = pendingUpdate.action
        if(action instanceof Function) {
            result.memoizedState = action(baseState); // 如果action是函数，执行它并更新状态
        }else{
            result.memoizedState = action; // 否则直接使用action作为新的状态
        }
    }
    return result;
}