
// Exports
export {
	instanceOfSerializedUser,
	instanceOfSerializedProgram,
	instanceOfSerializedCourse,
	instanceOfSerializedGraph,
	instanceOfSerializedDomain,
	instanceOfSerializedSubject,
	instanceOfSerializedLecture,
	instanceOfSerializedLink
}

export type {
	SerializedUser,
	SerializedProgram,
	SerializedCourse,
	SerializedGraph,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture,
	SerializedLink
}


// --------------------> Types


type SerializedUser = {
	id: number,				  // Unique identifier
	role: string,			  // User role
	netid: string,			  // User netid
	first_name: string,		  // User first name
	last_name: string,		  // User last name
	email: string,			  // User email
	program_admin: number[],  // List of Program IDs this User is an admin of
	program_editor: number[], // List of Program IDs this User is an editor of
	course_admin: number[],	  // List of Course IDs this User is an admin of
	course_editor: number[]	  // List of Course IDs this User is an editor of
}

type SerializedProgram = {
	id: number,		   // Unique identifier
	name: string,	   // Program name
	courses: number[], // List of course IDs
	admins: number[],  // List of admin User IDs
	editors: number[]  // List of editor User IDs
}

type SerializedCourse = {
	id: number,		   // Unique identifier
	code: string,	   // Course code
	name: string,	   // Course name
	graphs: number[],  // List of graph IDs
	links: number[],   // List of link IDs
	admins: number[],  // List of admin User IDs
	editors: number[], // List of editor User IDs
	programs: number[] // List of program IDs this Course belongs to
}

type SerializedGraph = {
	id: number,			// Unique identifier
	name: string,		// Graph name
	course: number,		// Course ID this Graph belongs to
	domains: number[],	// List of domain IDs
	subjects: number[],	// List of subject IDs
	lectures: number[],	// List of lecture IDs
	links: number[]		// List of link IDs
}

type SerializedDomain = {
	id: number,			  // Unique identifier
	x: number,			  // X-coordinate of the Domain
	y: number,			  // Y-coordinate of the Domain
	name: string,		  // Domain name
	style: string | null, // Domain style
	graph: number,		  // Graph ID this Domain belongs to
	parents: number[],	  // List of parent Domain IDs
	children: number[]	  // List of child Domain IDs
	subjects: number[]	  // List of subject IDs
}

type SerializedSubject = {
	id: number,			   // Unique identifier
	x: number,			   // X-coordinate of the Subject
	y: number,			   // Y-coordinate of the Subject
	name: string,		   // Subject name
	domain: number | null, // Domain ID this Subject belongs to
	graph: number,		   // Graph ID this Subject belongs to
	parents: number[],	   // List of parent Subject IDs
	children: number[],	   // List of child Subject IDs
	lectures: number[]	   // List of lecture IDs this Subject belongs to
}

type SerializedLecture = {
	id: number,			// Unique identifier
	name: string,		// Lecture name
	graph: number,		// Graph ID this Lecture belongs to
	subjects: number[]	// List of subject IDs
}

type SerializedLink = {
	id: number,			 // Unique identifier
	name: string,		 // Link name
	course: number,		 // Course ID this Link belongs to
	graph: number | null // Graph ID this Link belongs to
}


// --------------------> Instance Methods


function instanceOfSerializedUser(object: any): object is SerializedUser {
	return 'id' in object && 'role' in object && 'netid' in object && 'first_name' in object && 'last_name' in object && 'email' in object && 'program_admin' in object && 'program_editor' in object && 'course_admin' in object && 'course_editor' in object
}

function instanceOfSerializedProgram(object: any): object is SerializedProgram {
	return 'id' in object && 'name' in object && 'courses' in object && 'admins' in object && 'editors' in object
}

function instanceOfSerializedCourse(object: any): object is SerializedCourse {
	return 'id' in object && 'code' in object && 'name' in object && 'graphs' in object && 'admins' in object && 'editors' in object && 'programs' in object
}

function instanceOfSerializedGraph(object: any): object is SerializedGraph {
	return 'id' in object && 'name' in object && 'course' in object && 'domains' in object && 'subjects' in object && 'lectures' in object
}

function instanceOfSerializedDomain(object: any): object is SerializedDomain {
	return 'id' in object && 'x' in object && 'y' in object && 'name' in object && 'style' in object && 'graph' in object && 'parents' in object && 'children' in object && 'subjects' in object
}

function instanceOfSerializedSubject(object: any): object is SerializedSubject {
	return 'id' in object && 'x' in object && 'y' in object && 'name' in object && 'domain' in object && 'graph' in object && 'parents' in object && 'children' in object && 'lectures' in object
}

function instanceOfSerializedLecture(object: any): object is SerializedLecture {
	return 'id' in object && 'name' in object && 'graph' in object && 'subjects' in object
}

function instanceOfSerializedLink(object: any): object is SerializedLink {
	return 'id' in object && 'name' in object && 'course' in object && 'graph' in object
}