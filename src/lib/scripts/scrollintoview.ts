
const padding = 10

// Exports
export function scrollintoview(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
	if (rect.bottom + padding > window.innerHeight) {
		window.scroll({top: window.scrollY + rect.bottom - window.innerHeight + padding, behavior: 'smooth'})
	} else if (rect.top - padding < 0) {
		window.scroll({top: window.scrollY + rect.top - padding, behavior: 'smooth'})
	}
    
	return {}
}
