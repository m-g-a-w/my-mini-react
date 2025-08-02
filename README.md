# my-mini-react
npm run build:dev 进行打包
1.完成JSX部分
    JSX 的核心作用：
    简化 UI 描述：用类 HTML 的语法替代繁琐的 createElement 函数调用。
    增强可读性：UI 结构一目了然，便于开发和维护。
    结合 JavaScript 逻辑：可以在 JSX 中直接嵌入变量、表达式和条件判断。
    例如：
    1. 基础用法：用 JSX 描述 UI
    没有 JSX 时，需要调用 React.createElement 来创建元素：
    javascript
    // 纯 JavaScript（无 JSX）
    const element = React.createElement(
    'div',
    { className: 'container' },
        React.createElement('h1', null, 'Hello React'),
        React.createElement('p', null, '这是用 createElement 创建的元素')
    );
    有了 JSX 后，写法更简洁，类似 HTML：
    // 使用 JSX
    const element = (
    <div className="container">
        <h1>Hello React</h1>
        <p>这是用 JSX 创建的元素</p>
    </div>
    );
两者最终效果完全一致，JSX 会被 Babel 等工具自动转换为上面的 createElement 调用。

第一种调试方式（临时方案）通过pnpm link --global进行链接 可以模拟实际项目引用React的情况 但是过程略显繁琐