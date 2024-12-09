
function getFocusableChildren(element: HTMLElement) {
	return Array.from(element.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'))
}

// Exports
export function focusFirstChild(element: HTMLElement) {
	const focusable = getFocusableChildren(element)
	if (focusable.length) {
		focusable[0].focus()
	}
}

export function focusLastChild(element: HTMLElement) {
	const focusable = getFocusableChildren(element)
	if (focusable.length) {
		focusable[focusable.length - 1].focus()
	}
}

export function focusOnLoad(element: HTMLElement) {
	element.focus()
}

export function loopFocus(element: HTMLElement, _sensitivity: any = null) {
	let focusable = getFocusableChildren(element)
	let index = focusable.findIndex(e => e === document.activeElement)

	function onFocusIn(event: FocusEvent) {
		index = focusable.findIndex(e => e === event.target)
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			if (index === -1) return

			event.preventDefault()
			
			// Go to the next focusable element
			index = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length
			while (!element.contains(focusable[index]) || (focusable[index] as HTMLButtonElement).disabled)
				index = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length
			focusable[index].focus()
		}
	}

	element.addEventListener('keydown', onKeyDown)
	element.addEventListener('focusin', onFocusIn)

	return {
		update(_new_sensitivity: any) {
			focusable = getFocusableChildren(element)
			index = focusable.findIndex(e => e === document.activeElement)
		},
		destroy() {
			element.removeEventListener('keydown', onKeyDown)
			element.removeEventListener('focusin', onFocusIn)
		}
	}
}