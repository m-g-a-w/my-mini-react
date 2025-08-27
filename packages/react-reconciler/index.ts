// 导出 fiber 相关
export { createContainer, updateContainer } from './src/fiberReconciler';
export { FiberNode, FiberRootNode, createWorkInProgress } from './src/fiber';

// 导出 workLoop 相关
export { scheduleUpdateOnFiber } from './src/workLoop';

// 导出 fiberHooks 相关
export { renderWithHooks } from './src/fiberHooks';

// 导出其他必要的模块
export { createUpdate, enqueueUpdate } from './src/updateQueue';
export { markRootFinished, markRootSuspended } from './src/fiberLanes'; 