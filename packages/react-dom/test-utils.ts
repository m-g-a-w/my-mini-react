import { ReactElementType } from 'shared/ReactTypes';
// @ts-ignore
import { createRoot } from './index';

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	// element
	return createRoot(div).render(element);
}
