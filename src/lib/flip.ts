import type { Attachment } from 'svelte/attachments';

/** The visible area an element can render into: the viewport, cut by ancestors that clip overflow */
function bounds(element: HTMLElement) {
	let top = 0;
	let left = 0;
	let bottom = window.innerHeight;
	let right = window.innerWidth;
	for (let parent = element.parentElement; parent; parent = parent.parentElement) {
		const { overflowX, overflowY, position } = getComputedStyle(parent);
		if (overflowX !== 'visible' || overflowY !== 'visible') {
			const rect = parent.getBoundingClientRect();
			top = Math.max(top, rect.top);
			left = Math.max(left, rect.left);
			bottom = Math.min(bottom, rect.bottom);
			right = Math.min(right, rect.right);
		}
		// Ancestors of a fixed or top-layer element (e.g. a modal dialog) don't clip it
		if (position === 'fixed' || parent.matches(':modal, :popover-open')) break;
	}
	return { top, left, bottom, right };
}

/**
 * Attach to an absolutely positioned dropdown that opens below its trigger: when there is not enough
 * room, it opens above instead, and to the other side when it overflows horizontally
 */
export const flip: Attachment<HTMLElement> = (element) => {
	const anchor = element.offsetParent?.getBoundingClientRect();
	if (!anchor) return;
	const rect = element.getBoundingClientRect();
	const area = bounds(element);
	const style = getComputedStyle(element);

	const below = area.bottom - anchor.bottom;
	const above = anchor.top - area.top;
	if (rect.bottom > area.bottom && above > below) {
		element.style.top = 'auto';
		element.style.bottom = '100%';
		element.style.marginBottom = style.marginTop;
		element.style.marginTop = '0';
	}

	if (rect.right > area.right && anchor.right - rect.width >= area.left) {
		// Align the right edges and grow leftwards
		element.style.left = 'auto';
		element.style.right = '0';
	} else if (rect.left < area.left && anchor.left + rect.width <= area.right) {
		// Align the left edges and grow rightwards
		element.style.right = 'auto';
		element.style.left = '0';
	}
};
