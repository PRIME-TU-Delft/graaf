
// Exports
export function focusfirst(element: HTMLElement) {
	const focusable = element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
	if (focusable.length) focusable[0].focus()
	return {}
}

export function focusthis(element: HTMLElement) {
	element.focus()
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
	const focusable = Array.from(element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
	if (!focusable.length) return {}
	let index = focusable.findIndex(e => e === document.activeElement)

	function onFocusIn(event: FocusEvent) {
		index = focusable.findIndex(e => e === event.target)
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			if (index === -1) return

			event.preventDefault()
			
			// Go to the next focusable element that still exists in the dom
			let next = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length
			while (!element.contains(focusable[next])) {
				next = (next + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length
			}

			// Focus
			index = next
			focusable[index].focus()
		}
	}

	element.addEventListener('keydown', onKeyDown)
	element.addEventListener('focusin', onFocusIn)

	return {
		destroy() {
			element.removeEventListener('keydown', onKeyDown)
			element.removeEventListener('focusin', onFocusIn)
		}
	}
}
