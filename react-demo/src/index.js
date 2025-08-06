import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return (
    <div>
        <Child></Child>
    </div>
  );
}
function Child(){
    return <span>big-react</span>;
}
const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);

console.log(React);
console.log(ReactDOM);
