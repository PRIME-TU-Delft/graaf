
// Internal dependencies
import * as settings from '$scripts/settings'

// Components
import Tooltip from '$components/Tooltip.svelte'
import { mount } from "svelte";

// Exports
export function tooltip(element: HTMLElement, text: string) {
	if (!text) return

	let instance: Tooltip
	let timeout: NodeJS.Timeout

	function mouseEnter() {
		timeout = setTimeout(() => {
			instance = mount(Tooltip, {
            				target: element,
            				props: { text }
            			})
		}, settings.UNIVERSAL_HOVER_DELAY)
	}

	function mouseLeave() {
		clearTimeout(timeout)
		instance?.$destroy()
	}

	element.style.position = 'relative'
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
