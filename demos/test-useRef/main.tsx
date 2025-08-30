import { useState, useEffect, useRef } from '../../packages/react';
import ReactDOM from '../../packages/react-dom';

function App() {
	const [isDel, del] = useState(false);
	const divRef = useRef(null);

	console.warn('render divRef', divRef.current);

	useEffect(() => {
		console.warn('useEffect divRef', divRef.current);
	}, []);

	return (
		<div ref={divRef} onClick={() => del(true)}>
			{isDel ? null : <Child />}
		</div>
	);
}

function Child() {
	return <p ref={(dom: any) => console.warn('dom is:', dom)}>Child</p>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
