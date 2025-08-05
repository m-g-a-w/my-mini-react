import reactDomConfig from "./react-dom.config";
import reactConfig from "./react.config.js";

export default () => {
    return [...reactDomConfig, ...reactConfig];
}