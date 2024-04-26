import { Entity, Property, PrimaryKey, Enum, ManyToOne } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

import { Program } from './Program.ts';


export enum CourseType {
	COURSE = 'course',
	SANDBOX = 'sandbox'
}


@Entity()
export class Course {
	@PrimaryKey()
	id: string = uuid();

	@Property()
	code: string;

	@Property()
	name: string;

	@Property({ nullable: true })
	description?: string;

	@Enum({ items: () => CourseType, nativeEnumName: 'course_type' })
	type: CourseType = CourseType.COURSE;

	@ManyToOne()
	program: Program;

	@Property()
	createdAt = new Date();

	@Property({ onUpdate: () => new Date() })
	updatedAt = new Date();

	constructor(code: string, name: string, program: Program, description?: string, type: CourseType = CourseType.COURSE) {
		this.code = code;
		this.name = name;
		this.program = program;
		this.description = description;
		this.type = type;
	}
}
