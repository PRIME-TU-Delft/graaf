import { Entity, Property, PrimaryKey, OneToMany, ManyToMany, Collection } from '@mikro-orm/core';

import { Course } from './Course.ts';
import { User } from './User.ts';

@Entity()
export class Program {
	@PrimaryKey()
	id!: number;

	@Property()
	name: string;

	@Property({ nullable: true })
	description?: string;

	@Property()
	createdAt = new Date();

	@Property({ onUpdate: () => new Date() })
	updatedAt = new Date();

	@OneToMany(() => Course, (course) => course.program)
	courses = new Collection<Course>(this);

	@ManyToMany({ entity: () => User, inversedBy: 'programs' })
	coordinators = new Collection<User>(this);

	constructor(name: string, description?: string) {
		this.name = name;
		this.description = description;
	}
}
