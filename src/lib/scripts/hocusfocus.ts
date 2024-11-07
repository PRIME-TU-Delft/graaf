
function getFocusableChildren(element: HTMLElement) {
	return Array.from(element.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'))
}

// Exports
export function focusFirstChild(element: HTMLElement) {
	const focusable = getFocusableChildren(element)
	if (focusable.length) {
		focusable[0].focus()
		console.log('FocusFirstChild focused')
	}
}

export function focusOnLoad(element: HTMLElement) {
	element.focus()
	console.log('FocusOnLoad focused')
}

export function focusOnHover(element: HTMLElement) {
	function onHover() {
		element.focus()
		console.log('FocusOnHover focused')
	}

	element.addEventListener('mouseenter', onHover)

	return {
		destroy() {
			element.removeEventListener('mouseenter', onHover)
		}
	}
}

export function focusOnKeydown(element: HTMLElement, key?: string) {
	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab' || event.key === 'Enter' || key && event.key !== key) return
		element.focus()
		console.log('FocusOnKeydown focused')
	}

	document.addEventListener('keydown', onKeyDown)

	return {
		destroy() {
			document.removeEventListener('keydown', onKeyDown)
		}
	}
}

export function loopFocus(element: HTMLElement) {
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
			while (!element.contains(focusable[index])) 
				index = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length
			focusable[index].focus()
			console.log('LoopFocus focused')
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

export function preventFocus(element: HTMLElement) {
	let last_focus = document.activeElement as HTMLElement | null

	function onFocus(event: FocusEvent) {
		if (element === event.target || element.contains(event.target as HTMLElement)) {
			last_focus?.focus()
		} else {
			last_focus = document.activeElement as HTMLElement | null
		}
	}

	document.addEventListener('focus', onFocus)

	return {
		destroy() {
			document.removeEventListener('focus', onFocus)
		}
	}
}
