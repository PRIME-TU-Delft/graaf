import Tooltip from '$components/Tooltip.svelte';

export function tooltip(element: HTMLElement, text: string) {
	if (text === '') return;

	let tooltipInstance: Tooltip;
	let timeout: number;

	function mouseEnter() {
		timeout = setTimeout(() => {
			tooltipInstance = new Tooltip({
				target: document.body,
				props: {
					text: text,
					x: element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2,
					y: element.getBoundingClientRect().top - 6
				}
			});
		}, 1000);
	}

	function mouseLeave() {
		clearTimeout(timeout);
		tooltipInstance.$destroy();
	}

	element.addEventListener('mouseenter', mouseEnter);
	element.addEventListener('mouseleave', mouseLeave);

	return {
		destroy() {
			element.removeEventListener('mouseenter', mouseEnter);
			element.removeEventListener('mouseleave', mouseLeave);
			tooltipInstance?.$destroy();
		}
	};
}
