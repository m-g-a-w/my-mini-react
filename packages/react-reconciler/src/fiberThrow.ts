import { Wakeable } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { ShouldCapture } from './fiberFlags';
import { Lane, Lanes, SyncLane, markRootPinged } from './fiberLanes';
import { getSuspenseHandler } from './suspenseContext';
import { SuspenseComponent } from './workTags';
import { SuspenseException, getSuspenseThenable } from './thenable';

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
			// 移除对 workLoop 的直接调用，改为通过回调函数
			if (root.onPing) {
				root.onPing(lane);
			}
		}
		wakeable.then(ping, ping);
	}
}

export function throwException(root: FiberRootNode, value: any, lane: Lane, workInProgress?: FiberNode | null) {
	// 特殊处理 SuspenseException
	if (value === SuspenseException) {
		// 对于 SuspenseException，我们需要找到 Suspense 边界并标记它应该捕获
		let suspenseBoundary = getSuspenseHandler();
		
		if (suspenseBoundary) {
			suspenseBoundary.flags |= ShouldCapture;
		}
		return;
	}

	if (
		value !== null &&
		typeof value === 'object' &&
		typeof value.then === 'function'
	) {
		const weakable: Wakeable<any> = value;

		const suspenseBoundary = getSuspenseHandler();
		
		if (suspenseBoundary) {
			suspenseBoundary.flags |= ShouldCapture;
		}
		attachPingListener(root, weakable, lane);
	}
}
