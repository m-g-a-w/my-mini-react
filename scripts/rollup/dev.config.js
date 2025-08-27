import reactDomConfig from "./react-dom.config";
import reactReconcilerConfig from "./react-reconciler.config.js";
import reactConfig from "./react.config.js";
import reactNoopRendererConfig from "./react-noop-renderer.config.js";

export default () => {
    return [...reactDomConfig, ...reactReconcilerConfig, ...reactConfig, ...reactNoopRendererConfig];
}