import { FiberRootNode } from './fiber';
import { unstable_getCurrentPriorityLevel, unstable_ImmediatePriority, unstable_UserBlockingPriority, unstable_NormalPriority, unstable_IdlePriority } from 'scheduler';
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
export type Lane = number;
export type Lanes = number;

export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;
export const InputContinuousLane = 0b0010;
export const DefaultLane = 0b0100;
export const TransitionLane = 0b0100;
export const IdleLane = 0b1000;

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
    return laneA | laneB;
}

export function requestUpdateLane(){
    const isTransition = ReactCurrentBatchConfig.transition !== 0;
    if(isTransition){
        return TransitionLane;
    }
    const currentSchedulerPriority = unstable_getCurrentPriorityLevel();
    const lane = schedulerPriorityToLane(currentSchedulerPriority);
    return lane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
    return lanes & -lanes;
}

export function isSubsetOfLanes(set: Lanes, subset: Lane) {
    return (set & subset) === subset;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
    root.pendingLanes &= ~lane;
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
}

export function markRootPinged(root: FiberRootNode, pingedLane: Lane) {
    root.pingedLanes |= root.suspendedLanes & pingedLane
}

export function markRootSuspended(root: FiberRootNode, suspendedLane: Lane) {
    root.suspendedLanes |= suspendedLane;
    root.pingedLanes &= ~suspendedLane;
}

export function getNextLane(root: FiberRootNode): Lane {
    const pendingLanes = root.pendingLanes;

    if (pendingLanes === NoLanes) {
        return NoLane;
    }
    let nextLane = NoLane;

    // 优先处理非挂起的 lanes
    const suspendedLanes = pendingLanes & ~root.suspendedLanes;
    if (suspendedLanes !== NoLanes) {
        nextLane = getHighestPriorityLane(suspendedLanes);
    } else {
        // 如果没有非挂起的 lanes，检查是否有 pinged 的 lanes
        const pingedLanes = pendingLanes & root.pingedLanes;
        if (pingedLanes !== NoLanes) {
            nextLane = getHighestPriorityLane(pingedLanes);
        }
    }
    return nextLane;
}

export function includeSomeLanes(set: Lanes, subset: Lane | Lanes): boolean {
    return (set & subset) !== NoLanes;
}

export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
    return set & ~subset;
}

export function lanesToSchedulerPriority(lanes: Lanes){
    const lane = getHighestPriorityLane(lanes);
    if(lane === SyncLane){
        return unstable_ImmediatePriority;
    }
    if(lane === InputContinuousLane){
        return unstable_UserBlockingPriority;
    }
    if(lane === DefaultLane){
        return unstable_NormalPriority;
    }
    return unstable_IdlePriority;
}
function schedulerPriorityToLane(schedulerPriority: number){
    if(schedulerPriority === unstable_ImmediatePriority){
        return SyncLane;
    }
    if(schedulerPriority === unstable_UserBlockingPriority){
        return InputContinuousLane;
    }
    if(schedulerPriority === unstable_NormalPriority){
        return DefaultLane;
    }
    return NoLane;
}