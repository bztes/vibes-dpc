import type { Attachment } from 'svelte/attachments';

/** Calls `onclose` on a click outside the element or on Escape; attach it only while open */
export function dismiss(onclose: () => void): Attachment<HTMLElement> {
	return (element) => {
		const onclick = (event: MouseEvent) => {
			if (!element.contains(event.target as Node)) onclose();
		};
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onclose();
		};
		window.addEventListener('click', onclick);
		window.addEventListener('keydown', onkeydown);
		return () => {
			window.removeEventListener('click', onclick);
			window.removeEventListener('keydown', onkeydown);
		};
	};
}
