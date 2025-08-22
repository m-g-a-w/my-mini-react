import { createElement, useState } from '../../packages/react'
import { createRoot } from '../../packages/react-dom/src/root'

function App(props: any) {
  const [num, updateNum] = useState(50)
  return (
    <ul>
      {new Array(num).fill(0).map((_, index) => (
        <li key={index}>{index + 1}</li>
      ))}
    </ul>
  )
}
const root = createRoot(document.getElementById('root'))
root.render(createElement(App, {}))
