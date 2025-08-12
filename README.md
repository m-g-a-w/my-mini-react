# my-mini-react

npm run build:dev 进行打包
1.完成JSX部分
    JSX:一种"类XML语法"的ECMAScript语法糖 
        核心作用：
            简化 UI 描述：用类 HTML 的语法替代繁琐的 createElement 函数调用。
            增强可读性：UI 结构一目了然，便于开发和维护。
            结合 JavaScript 逻辑：可以在 JSX 中直接嵌入变量、表达式和条件判断。
        例如：
        1. 基础用法：用 JSX 描述 UI
        没有 JSX 时，需要调用 React.createElement 来创建元素：
        ```javascript
        // 纯 JavaScript（无 JSX）
        const element = React.createElement(
        'div',
        { className: 'container' },
            React.createElement('h1', null, 'Hello React'),
            React.createElement('p', null, '这是用 JSX 创建的元素')
        );
        ```
        有了 JSX 后，写法更简洁，类似 HTML：
        ```
        // 使用 JSX
        const element = (
        <div className="container">
            <h1>Hello React</h1>
            <p>这是用 JSX 创建的元素</p>
        </div>
        );
        ```
    两者最终效果完全一致，JSX 会被 Babel 等工具自动转换为上面的 createElement 调用。


React实现原理：
（1）触发事件，改变自变量，开启更新流程
（2）执行VDOM相关操作，在React中被称为reconcile
（3）根据步骤（2）计算出的"需要变化的UI"执行对应的UI操作，在React中被称为commit

细粒度更新

AOT

VDOM


在 React 中，Reconcilie（协调） 是其核心算法之一，指的是：
当组件状态（State）或属性（Props）变化时，React 会对比新生成的虚拟 DOM 树与旧的虚拟 DOM 树，找出两者之间的差异（即 “Diffing” 过程），然后仅将变化的部分同步到真实 DOM 中的过程。
简单说，Reconciliation 的作用是计算出前后虚拟 DOM 的差异，为后续的 “DOM 更新” 提供依据，最终实现 “最小化 DOM 操作”（只更新必要的部分），从而提升性能。


2.diff算法（reconciler 协调器）







调试方式一：
    通过pnpm link --global进行链接 可以模拟实际项目引用React的情况 但是过程略显繁琐