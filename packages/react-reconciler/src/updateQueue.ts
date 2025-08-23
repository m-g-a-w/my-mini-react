import { Dispatch } from 'react/src/__tests__/currentDispatcher'
import { Action } from 'shared/ReactTypes';
import { Lane, isSubsetOfLanes, NoLane } from './fiberLanes';

export interface Update<State> {
    action: Action<State>; // 更新动作
    next: Update<any> | null;
    lane: Lane;
}
export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null; // 待处理的更新
    }
    dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(action: Action<State>, lane: Lane): Update<State> => {
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
    const pending = updateQueue.shared.pending;
    if (pending === null) {
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    updateQueue.shared.pending = update;
}
export const processUpdateQueue = <State>(
    baseState: State,
    pendingUpdate: Update<State> | null,
    renderLane: Lane
): {
    memoizedState: State,
    baseState: State,
    baseQueue: Update<State> | null,
} => {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState,
        baseState,
        baseQueue: null,
    }; // 初始化结果为基础状态
    if (pendingUpdate !== null) {
        let first = pendingUpdate.next
        let pending = pendingUpdate.next as Update<any>;

        let newBaseState = baseState;
        let newBaseQueueFirst: Update<State> | null = null;
        let newBaseQueueLast: Update<State> | null = null;
        let newState = baseState;

        do {
            const updateLane = pending.lane;
            if (!isSubsetOfLanes(renderLane, updateLane)) {
                //优先级不够 被跳过
                const clone = createUpdate(pending.action, pending.lane);
                if (newBaseQueueLast === null) {
                    newBaseQueueFirst = clone;
                    newBaseQueueLast = clone;
                    newBaseState = newState;
                } else {
                    (newBaseQueueLast as Update<State>).next = clone;
                    newBaseQueueLast = clone;
                }
            } else {
                //优先级足够
                if (newBaseQueueLast !== null) {
                    const clone = createUpdate(pending.action, NoLane);
                    newBaseQueueLast.next = clone;
                    newBaseQueueLast = clone;
                }
                const action = pending.action;
                if (action instanceof Function) {
                    newState = action(newState); // 如果action是函数，执行它并更新newState
                } else {
                    newState = action; // 否则直接使用action作为新的状态
                }
            }
            pending = pending.next as Update<State>;
        } while (pending !== first && pending !== null)
        if (newBaseQueueLast === null) {
            //本次计算没有update被跳过
            newBaseState = newState;
        }else{
            newBaseQueueLast.next = newBaseQueueFirst;
        }
        result.memoizedState = newState; // 使用newState作为最终状态
        result.baseState = newBaseState;
        result.baseQueue = newBaseQueueLast
    }
    return result;
}