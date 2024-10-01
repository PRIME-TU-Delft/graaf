
// Exports
export type { SerializedProgram, SerializedCourse, SerializedGraph, SerializedDomain, SerializedSubject, SerializedLecture, SerializedUser }


// --------------------> Types


type SerializedProgram = {
	id: number,
	name: string
}

type SerializedCourse = {
	id: number,
	code: string,
	name: string
}

type SerializedGraph = {
	id: number,
	name: string
}

type SerializedDomain = {
	id: number,
	x: number,
	y: number,
	name?: string,
	style?: string,
	parents: number[],
	children: number[]
}

type SerializedSubject = {
	id: number,
	x: number,
	y: number,
	name?: string,
	domain?: number,
	parents: number[],
	children: number[]
}

type SerializedLecture = {
	id: number,
	name?: string,
	subjects: number[]
}

type SerializedUser = {
	id: number,
	netid: string,
	first_name: string,
	last_name: string,
    role: string,
	email?: string
}