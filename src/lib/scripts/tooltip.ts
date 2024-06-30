
// Components
import Tooltip from '$components/Tooltip.svelte'

// Exports
export function tooltip(element: HTMLElement, text: string) {
	// Show a tooltip with the given text when the mouse hovers over the element.

	if (text === '') return

	let instance: Tooltip
	let timeout: NodeJS.Timeout

	function mouseEnter() {
		timeout = setTimeout(() => {
			const rect = element.getBoundingClientRect()
			instance = new Tooltip({
				target: document.body,
				props: {
					text: text,
					x: rect.left + rect.width / 2,
					y: rect.top
				}
			})
		}, 800)
	}

	function mouseLeave() {
		clearTimeout(timeout)
		instance?.$destroy()
	}

	element.addEventListener('mouseenter', mouseEnter)
	element.addEventListener('mouseleave', mouseLeave)

	return {
		update(newText: string) {
			instance?.$set({ text: newText })
			text = newText
		},

		destroy() {
			element.removeEventListener('mouseenter', mouseEnter)
			element.removeEventListener('mouseleave', mouseLeave)
			instance?.$destroy()
		}
	}
}
