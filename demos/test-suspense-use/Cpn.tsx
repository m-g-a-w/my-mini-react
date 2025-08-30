import { useState, use, useEffect } from '../../packages/react';

const delay = (t: number) =>
	new Promise((r) => {
		setTimeout(r, t);
	});

const cachePool: any[] = [];

function fetchData(id: number, timeout: number) {
	const cache = cachePool[id];
	if (cache) {
		return cache;
	}
	return (cachePool[id] = delay(timeout).then(() => {
		return { data: Math.floor(Math.random() * 100) };
	}));
}

// 将 Promise 创建移到组件外部
const dataPromises: any[] = [];

interface CpnProps {
	id: number;
	timeout: number;
}

interface DataResult {
	data: number;
}

export function Cpn({ id, timeout }: CpnProps) {
	const [num, updateNum] = useState(0);
	
	// 确保每个 id 只创建一次 Promise
	if (!dataPromises[id]) {
		dataPromises[id] = fetchData(id, timeout);
	}
	
	const { data } = use(dataPromises[id]) as DataResult;

	if (num !== 0 && num % 5 === 0) {
		cachePool[id] = null;
		dataPromises[id] = null; // 同时清除 Promise 缓存
	}

	useEffect(() => {
		console.log('effect create');
		return () => console.log('effect destroy');
	}, []);

	return (
		<ul onClick={() => updateNum(num + 1)}>
			<li>ID: {id}</li>
			<li>随机数: {data}</li>
			<li>状态: {num}</li>
		</ul>
	);
}
