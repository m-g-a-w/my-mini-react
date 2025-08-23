import { Props } from '../../shared/ReactTypes'
import { Container } from './hostConfig'
import { unstable_ImmediatePriority, unstable_UserBlockingPriority, unstable_NormalPriority, unstable_runWithPriority } from 'scheduler'

const validateEventTypeList = ['click']
export const elementPropsKey = '__props'

type EventCallback = (e: Event) => void

interface Paths {
    capture: EventCallback[]
    bubble: EventCallback[]
}
interface SyntheticEvent extends Event {
    __stopPropagation: boolean
}

export interface DOMElement extends Element {
    [elementPropsKey]: Props
}

export function updateFiberProps(node: DOMElement, props: Props) {
    node[elementPropsKey] = props
}
export function initEvent(container: Container, eventType: string) {
    // 添加容器有效性检查
    if (!container || !(container instanceof Element)) {
        return;
    }
    if (!validateEventTypeList.includes(eventType)) {
        console.warn("当前不支持的事件类型", eventType)
        return
    }
    if (__DEV__) {
        console.log("初始化事件", eventType)
    }
    container.addEventListener(eventType, (e) => {
        dispatchEvent(container, eventType, e)
    })
}

function createSyntheticEvent(event: Event) {
    const syntheticEvent = event as SyntheticEvent
    syntheticEvent.__stopPropagation = false
    const originalStopPropagation = event.stopPropagation
    syntheticEvent.stopPropagation = () => {
        syntheticEvent.__stopPropagation = true
        if (originalStopPropagation) {
            originalStopPropagation()
        }
    }
    return syntheticEvent
}

function dispatchEvent(container: Container, eventType: string, event: Event) {
    const targetElement = event.target
    if (targetElement === null) {
        console.warn("事件不存在target", event)
        return
    }
    //1.获取事件
    const { bubble, capture } = collectPaths(targetElement as DOMElement, container, eventType)

    //2.构造合成时间
    const se = createSyntheticEvent(event)
    //3.遍历capture
    triggerEventFolw(capture, se)
    if (!se.__stopPropagation) {
        //4.遍历bubble
        triggerEventFolw(bubble, se)
    }
}
function getEventCallbackNameFromEventType(eventType: string): string[] | undefined {
    return {
        click: ['onClickCapture', 'onClick']
    }[eventType]
}
function triggerEventFolw(path: EventCallback[], se: SyntheticEvent) {
    for (let i = 0; i < path.length; i++) {
        const callback = path[i]
        unstable_runWithPriority(eventTypeToSchedulerPriority(se.type),() => {
            callback.call(null, se)
        })
        if (se.__stopPropagation) {
            break//阻止事件继续传播
        }
    }
}


function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
    const paths: Paths = {
        capture: [],
        bubble: []
    }
    while (targetElement && targetElement !== container) {
        const elementProps = targetElement[elementPropsKey]
        if (elementProps) {
            //click
            const callbackNameList = getEventCallbackNameFromEventType(eventType)
            if (callbackNameList) {
                callbackNameList.forEach((callbackName, i) => {
                    const eventCallback = elementProps[callbackName]
                    if (eventCallback) {
                        if (i === 0) {
                            paths.capture.unshift(eventCallback)
                        } else {
                            paths.bubble.push(eventCallback)
                        }
                    }
                })
            }
        }
        targetElement = targetElement.parentNode as DOMElement
    }
    return paths
}
function eventTypeToSchedulerPriority(eventType: string) {
    switch (eventType) {
        case 'click':
        case 'mousedown':
        case 'mouseup':
            return unstable_ImmediatePriority
        case 'scroll':
            return unstable_UserBlockingPriority
        default:
            return unstable_NormalPriority
    }
}