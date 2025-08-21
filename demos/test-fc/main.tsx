import {useState, useEffect} from 'react'
import ReactDOM from 'react-noop-renderer'

function App() {
  const [num,updateNum] = useState(0)
  // useEffect(() => {
  //   console.log('app mount')
  // },[])
  // useEffect(() => {
  //   console.log('num change create',num)
  //   return()=>{
  //     console.log('num change destroy',num)
  //   }
  // },[num])
  return (
    <>
      <div>hello world</div>
      <Child/>
    </>
  )
}
function Child(){
  useEffect(() => {
    console.log('child mount')
    return()=>{
      console.log('child unmount')
    }
  },[])
  return 'i am child'
}
const root =  ReactDOM.createRoot()
root.render(<App />)

window.root = root
