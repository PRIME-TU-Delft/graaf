export function clickoutside(element: HTMLElement, callback: () => void) {
    function onClick(event: MouseEvent) {
        if (!element.contains(event.target as Node)) {
            callback();
        }
    }
    
    document.body.addEventListener('click', onClick);
    
    return {
        update(newCallback: () => void) {
            callback = newCallback;
        },

        destroy() {
            document.body.removeEventListener('click', onClick);
        }
    }
}