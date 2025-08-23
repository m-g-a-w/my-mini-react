import { FiberNode } from "./fiber";
import { Lane } from "./fiberLanes";

// 调度器接口，用于打破循环依赖
export interface Scheduler {
    scheduleUpdateOnFiber: (fiber: FiberNode, lane: Lane) => void;
}

// 默认调度器实现
let scheduler: Scheduler | null = null;

export function setScheduler(newScheduler: Scheduler) {
    scheduler = newScheduler;
}

export function getScheduler(): Scheduler {
    if (!scheduler) {
        throw new Error('Scheduler not initialized');
    }
    return scheduler;
} 