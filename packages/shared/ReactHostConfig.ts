import { Props } from './ReactTypes';

// Common interface for host configuration
export interface HostConfig<Container, Instance, TextInstance> {
    createInstance(type: string, props: Props): Instance;
    createTextInstance(content: string): TextInstance;
    appendInitialChild(parent: Instance | Container, child: Instance): void;
    appendChildToContainer(parent: Container, child: Instance): void;
    commitUpdate(fiber: any): void;
    commitTextUpdate(textInstance: TextInstance, content: string): void;
    removeChild(child: Instance | TextInstance, container: Container): void;
    insertChildToContainer(child: Instance, container: Container, before: Instance): void;
    scheduleMicroTask(callback: (...args: any[]) => void): void;
}

// Common types that can be extended by specific renderers
export type Container = any;
export type Instance = any;
export type TextInstance = any; 