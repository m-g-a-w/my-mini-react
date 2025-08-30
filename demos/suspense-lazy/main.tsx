import { Suspense, lazy } from '../../packages/react';
import ReactDOM from '../../packages/react-dom';

function delay(promise) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(promise);
		}, 2000);
	});
}

const Cpn = lazy(() => import('./Cpn').then((res) => delay(res)));

function App() {
	return (
		<Suspense fallback={<div>loading</div>}>
			<Cpn />
		</Suspense>
	);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
