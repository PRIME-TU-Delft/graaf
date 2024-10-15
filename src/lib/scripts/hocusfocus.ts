
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
		has_focus = element.contains(document.activeElement) || 
					element === document.activeElement ||
					document.activeElement === document.body
		if (had_focus && !has_focus) callback()
	}

	let has_focus = element.contains(document.activeElement)
	document.addEventListener('focusin', checkFocus)
	document.addEventListener('focusout', checkFocus)

	return {
		destroy() {
			document.removeEventListener('focusin', checkFocus)
			document.removeEventListener('focusout', checkFocus)
		}
	}
}

export function loopfocus(element: HTMLElement) {
	const focusable = element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
	if (!focusable.length) return {}

	let index = 0
	focusable[index].focus()

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			event.preventDefault()
			index = (index + 1) % focusable.length
			focusable[index].focus()
		}
	}

	element.addEventListener('keydown', onKeyDown)

	return {
		destroy() {
			element.removeEventListener('keydown', onKeyDown)
		}
	}
}
