
export type EditorType = 'nodes' | 'layout'

export function validEditorType(type: any): type is EditorType {
    return type === 'nodes' || type === 'layout'
}

export type EditorView = 'domains' | 'subjects' | 'lectures'

export function validEditorView(view: any): view is EditorView {
    return view === 'domains' || view === 'subjects' || view === 'lectures'
}