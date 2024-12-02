
// Internal dependencies
import {
	validDomainStyle,
	validUserRole
} from '$scripts/types'

import type { 
	DomainStyle,
	UserRole
} from '$scripts/types'


// --------------------> Serialized Controllers


export type SerializedProgram = {
	id: number,
	unchanged: boolean,
	name: string,
	course_ids?: number[],
	editor_ids?: string[],
	admin_ids?: string[]
}

export function validSerializedProgram(object: any): object is SerializedProgram {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.name === 'string'
		&& (object.course_ids === undefined || Array.isArray(object.course_ids) && object.course_ids.every((id: any) => typeof id === 'number'))
		&& (object.editor_ids === undefined || Array.isArray(object.editor_ids) && object.editor_ids.every((id: any) => typeof id === 'string'))
		&& (object.admin_ids === undefined  || Array.isArray(object.admin_ids) && object.admin_ids.every((id: any) => typeof id === 'string'))
}

export type SerializedCourse = {
	id: number,
	unchanged: boolean,
	code: string,
	name: string,
	program_ids?: number[],
	graph_ids?: number[],
	link_ids?: number[],
	editor_ids?: string[],
	admin_ids?: string[]
}

export function validSerializedCourse(object: any): object is SerializedCourse {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.code === 'string'
		&& typeof object.name === 'string'
		&& (object.program_ids === undefined || Array.isArray(object.program_ids) && object.program_ids.every((id: any) => typeof id === 'number'))
		&& (object.graph_ids === undefined || Array.isArray(object.graph_ids) && object.graph_ids.every((id: any) => typeof id === 'number'))
		&& (object.link_ids === undefined || Array.isArray(object.link_ids) && object.link_ids.every((id: any) => typeof id === 'number'))
		&& (object.editor_ids === undefined || Array.isArray(object.editor_ids) && object.editor_ids.every((id: any) => typeof id === 'string'))
		&& (object.admin_ids === undefined || Array.isArray(object.admin_ids) && object.admin_ids.every((id: any) => typeof id === 'string'))
}

export type SerializedGraph = {
	id: number,
	unchanged: boolean,
	name: string,
	course_id?: number,
	domain_ids?: number[],
	subject_ids?: number[],
	lecture_ids?: number[],
	link_ids?: number[]
}

export function validSerializedGraph(object: any): object is SerializedGraph {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.name === 'string'
		&& (object.course_id === undefined || typeof object.course_id === 'number')
		&& (object.domain_ids === undefined || Array.isArray(object.domain_ids) && object.domain_ids.every((id: any) => typeof id === 'number'))
		&& (object.subject_ids === undefined || Array.isArray(object.subject_ids) && object.subject_ids.every((id: any) => typeof id === 'number'))
		&& (object.lecture_ids === undefined || Array.isArray(object.lecture_ids) && object.lecture_ids.every((id: any) => typeof id === 'number'))
		&& (object.link_ids === undefined || Array.isArray(object.link_ids) && object.link_ids.every((id: any) => typeof id === 'number'))
}

export type SerializedDomain = {
	id: number,
	unchanged: boolean,
	name: string,
	style: DomainStyle | null,
	order: number,
	x: number,
	y: number,
	graph_id?: number,
	parent_ids?: number[],
	child_ids?: number[],
	subject_ids?: number[]
}

export function validSerializedDomain(object: any): object is SerializedDomain {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.name === 'string'
		&& (object.style === null || validDomainStyle(object.style))
		&& typeof object.order === 'number'
		&& typeof object.x === 'number'
		&& typeof object.y === 'number'
		&& (object.graph_id === undefined || typeof object.graph_id === 'number')
		&& (object.parent_ids === undefined || Array.isArray(object.parent_ids) && object.parent_ids.every((id: any) => typeof id === 'number'))
		&& (object.child_ids === undefined || Array.isArray(object.child_ids) && object.child_ids.every((id: any) => typeof id === 'number'))
		&& (object.subject_ids === undefined || Array.isArray(object.subject_ids) && object.subject_ids.every((id: any) => typeof id === 'number'))
}

export type SerializedSubject = {
	id: number,
	unchanged: boolean,
	name: string,
	x: number,
	y: number,
	graph_id?: number,
	domain_id?: number | null,
	parent_ids?: number[],
	child_ids?: number[],
	lecture_ids?: number[]
}

export function validSerializedSubject(object: any): object is SerializedSubject {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.name === 'string'
		&& typeof object.x === 'number'
		&& typeof object.y === 'number'
		&& (object.graph_id === undefined || typeof object.graph_id === 'number')
		&& (object.domain_id === undefined || object.domain_id === null || typeof object.domain_id === 'number')
		&& (object.parent_ids === undefined || Array.isArray(object.parent_ids) && object.parent_ids.every((id: any) => typeof id === 'number'))
		&& (object.child_ids === undefined || Array.isArray(object.child_ids) && object.child_ids.every((id: any) => typeof id === 'number'))
		&& (object.lecture_ids === undefined || Array.isArray(object.lecture_ids) && object.lecture_ids.every((id: any) => typeof id === 'number'))
}

export type SerializedLecture = {
	id: number,
	unchanged: boolean,
	name: string,
	order: number,
	graph_id?: number,
	subject_ids?: number[]
}

export function validSerializedLecture(object: any): object is SerializedLecture {
	return typeof object.id === 'number'
		&& typeof object.unchanged === 'boolean'
		&& typeof object.name === 'string'
		&& typeof object.order === 'number'
		&& (object.graph_id === undefined || typeof object.graph_id === 'number')
		&& (object.subject_ids === undefined || Array.isArray(object.subject_ids) && object.subject_ids.every((id: any) => typeof id === 'number'))
}

export type SerializedLink = {
	id: number,
	unchanged: boolean,
	name: string,
	course_id?: number,
	graph_id?: number | null
}

export function validSerializedLink(object: any): object is SerializedLink {
	return typeof object.id === 'number'
		&& typeof object.name === 'string'
		&& (object.course_id === undefined || typeof object.course_id === 'number')
		&& (object.graph_id === undefined || object.graph_id === null || typeof object.graph_id === 'number')
}

export type SerializedUser = {
	id: string,
	role: UserRole,
	first_name: string | null,
	last_name: string | null,
	email: string,
	course_editor_ids?: number[],
	course_admin_ids?: number[],
	program_editor_ids?: number[],
	program_admin_ids?: number[]
}

export function validSerializedUser(object: any): object is SerializedUser {
	return typeof object.id === 'string'
		&& validUserRole(object.role)
		&& typeof object.netid === 'string'
		&& typeof object.first_name === 'string'
		&& typeof object.last_name === 'string'
		&& typeof object.email === 'string'
		&& (object.course_editor_ids === undefined || Array.isArray(object.course_editor_ids) && object.course_editor_ids.every((id: any) => typeof id === 'number'))
		&& (object.course_admin_ids === undefined || Array.isArray(object.course_admin_ids) && object.course_admin_ids.every((id: any) => typeof id === 'number'))
		&& (object.program_editor_ids === undefined || Array.isArray(object.program_editor_ids) && object.program_editor_ids.every((id: any) => typeof id === 'number'))
		&& (object.program_admin_ids === undefined || Array.isArray(object.program_admin_ids) && object.program_admin_ids.every((id: any) => typeof id === 'number'))
}
