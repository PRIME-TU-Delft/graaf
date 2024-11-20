
export type EditorType = 'data' | 'layout'

export function validEditorType(type: any): type is EditorType {
    return type === 'data' || type === 'layout'
}

export type EditorView = 'domains' | 'subjects' | 'lectures'

export function validEditorView(view: any): view is EditorView {
    return view === 'domains' || view === 'subjects' || view === 'lectures'
}