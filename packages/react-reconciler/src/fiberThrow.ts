import { Wakeable } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { ShouldCapture } from './fiberFlags';
import { Lane, Lanes, SyncLane, markRootPinged } from './fiberLanes';
import { ensureRootIsScheduled, markRootUpdated } from './workLoop';
import { getSuspenseHandler } from './suspenseContext';
import { SuspenseComponent } from './workTags';

function attachPingListener(
	root: FiberRootNode,
	wakeable: Wakeable<any>,
	lane: Lane
) {
	let pingCache = root.pingCache;
	let threadIDs: Set<Lane> | undefined;

	// WeakMap{ wakeable: Set[lane1, lane2, ...]}
	if (pingCache === null) {
		threadIDs = new Set<Lane>();
		pingCache = root.pingCache = new WeakMap<Wakeable<any>, Set<Lane>>();
		pingCache.set(wakeable, threadIDs);
	} else {
		threadIDs = pingCache.get(wakeable);
		if (threadIDs === undefined) {
			threadIDs = new Set<Lane>();
			pingCache.set(wakeable, threadIDs);
		}
	}
	if (!threadIDs.has(lane)) {
		// 第一次进入
		threadIDs.add(lane);

		// eslint-disable-next-line no-inner-declarations
		function ping() {
			if (pingCache !== null) {
				pingCache.delete(wakeable);
			}
			markRootUpdated(root, lane);
			markRootPinged(root, lane);
			ensureRootIsScheduled(root);
		}
		wakeable.then(ping, ping);
	}
}

export function throwException(root: FiberRootNode, value: any, lane: Lane, workInProgress?: FiberNode | null) {
	if (
		value !== null &&
		typeof value === 'object' &&
		typeof value.then === 'function'
	) {
		const weakable: Wakeable<any> = value;

		let suspenseBoundary = getSuspenseHandler();
		
		// 如果没有找到 Suspense 处理器，主动向上遍历寻找 Suspense 边界
		if (!suspenseBoundary && workInProgress) {
			let fiber: FiberNode | null = workInProgress;
			while (fiber !== null) {
				if (fiber.tag === SuspenseComponent) {
					suspenseBoundary = fiber;
					if (__DEV__) {
						console.log('找到 Suspense 边界:', fiber);
					}
					break;
				}
				fiber = fiber.return;
			}
		}
		
		if (suspenseBoundary) {
			suspenseBoundary.flags |= ShouldCapture;
		} 
		attachPingListener(root, weakable, lane);
	}
}
