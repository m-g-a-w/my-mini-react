import reactDomConfig from "./react-dom.config";
import reactConfig from "./react.config.js";
import reactNoopRendererConfig from "./react-noop-renderer.config.js";

export default () => {
    return [...reactDomConfig, ...reactConfig, ...reactNoopRendererConfig];
}