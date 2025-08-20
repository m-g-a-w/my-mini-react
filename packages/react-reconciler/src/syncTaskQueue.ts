let syncTaskQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncTaskQueue = false;

export function scheduleSyncCallback(callback: (...args: any) => void){
    if(syncTaskQueue === null){
        syncTaskQueue = [callback];
    }else{
        syncTaskQueue.push(callback);
    }
}

export function flushSyncTaskQueue(){
    if(!isFlushingSyncTaskQueue && syncTaskQueue){
        isFlushingSyncTaskQueue = true;
        try{
            syncTaskQueue.forEach(callback => callback());
        }catch(error){
            if(__DEV__){
                console.error('flushSyncTaskQueue error',error);
            }
        }finally{
            isFlushingSyncTaskQueue = false;
        }
    }
}
