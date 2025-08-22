'use strict';

// 使用闭包来存储yields，避免属性被重新定义
let _yields = [];
let _currentTime = 0;

// 自定义的scheduler mock，包含测试需要的方法
const mockScheduler = {
  
  // 优先级常量
  unstable_IdlePriority: 1,
  unstable_LowPriority: 2,
  unstable_NormalPriority: 3,
  unstable_UserBlockingPriority: 4,
  unstable_ImmediatePriority: 5,
  
  // 核心方法
  unstable_now: function() {
    return _currentTime;
  },
  
  unstable_scheduleCallback: function(priorityLevel, callback, options) {
    // 简单实现，直接执行回调
    if (callback) {
      callback();
    }
    return { id: Math.random() };
  },
  
  unstable_cancelCallback: function(callbackNode) {
    // 简单实现
  },
  
  unstable_shouldYield: function() {
    return false;
  },
  
  unstable_requestPaint: function() {
    // 简单实现
  },
  
  unstable_getCurrentPriorityLevel: function() {
    return this.unstable_NormalPriority;
  },
  
  unstable_continueExecution: function() {
    // 简单实现
  },
  
  unstable_pauseExecution: function() {
    // 简单实现
  },
  
  unstable_getFirstCallbackNode: function() {
    return null;
  },
  
  unstable_next: function(eventHandler) {
    // 简单实现
    return eventHandler();
  },
  
  unstable_wrapCallback: function(callback) {
    return callback;
  },
  
  unstable_forceFrameRate: function() {
    // 简单实现
  },
  
  unstable_Profiling: null,
  
  // 测试专用方法
  unstable_clearYields: function() {
    const yields = [..._yields];
    _yields = [];
    return yields;
  },
  
  unstable_flushNumberOfYields: function(count) {
    // 简单实现
    return [];
  },
  
  unstable_flushExpired: function() {
    // 简单实现
    return [];
  },
  
  unstable_flushUntilNextPaint: function() {
    // 简单实现
    return [];
  },
  
  unstable_flushAll: function() {
    // 简单实现
    return [];
  },
  
  unstable_yieldValue: function(value) {
    console.log('unstable_yieldValue called with:', value);
    _yields.push(value);
  },
  
  unstable_advanceTime: function(ms) {
    _currentTime += ms;
  },
  
  unstable_setDisableYieldValue: function(value) {
    // 简单实现
  }
};

module.exports = mockScheduler; 