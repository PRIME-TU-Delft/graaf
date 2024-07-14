
// Exports
export function focusfirst(element: HTMLElement) {
	const focusable = element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
	if (focusable.length) focusable[0].focus()
	return {}
}

export function focusonhover(element: HTMLElement) {
	function onHover() {
		element.focus()
	}

	element.addEventListener('mouseenter', onHover)

	return {
		destroy() {
			element.removeEventListener('mouseenter', onHover)
		}
	}
}

export function losefocus(element: HTMLElement, callback: () => void) {
	function checkFocus() {
		let had_focus = has_focus
		has_focus = element.contains(document.activeElement)
		if (had_focus && !has_focus) callback()
	}

	let has_focus = element.contains(document.activeElement)
	document.addEventListener('focusin', checkFocus)

	return {
		destroy() {
			document.removeEventListener('focusin', checkFocus)
		}
	};
}
