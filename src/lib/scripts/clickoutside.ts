
// Exports
export function clickoutside(element: HTMLElement, callback: () => void) {
	function onClick(event: MouseEvent) {
		if (!element.contains(event.target as Node)) {
			callback();
		}
	}

	// Add a timeout to prevent the click event from firing immediately
	var timeout: NodeJS.Timeout;
	timeout = setTimeout(
		() => document.body.addEventListener('click', onClick),
		0
	)

	return {
		destroy() {
			clearTimeout(timeout);
			document.body.removeEventListener('click', onClick);
		}
	};
}
