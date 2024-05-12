import { Entity, Property, PrimaryKey, Enum, ManyToMany, Collection } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

import { Program } from './Program.ts';

export enum UserRole {
	USER = 'user',
	ADMIN = 'admin'
}

@Entity()
export class User {
	@PrimaryKey()
	id: string = uuid();

	@Property()
	netid: string;

	@Property()
	first_name: string;

	@Property()
	middle_name?: string;

	@Property()
	last_name: string;

	@Enum({ items: () => UserRole, nativeEnumName: 'user_role' })
	role: UserRole = UserRole.USER;

	@Property()
	createdAt = new Date();

	@Property({ nullable: true })
	email?: string;

	@ManyToMany(() => Program, (program) => program.coordinators)
	programs = new Collection<Program>(this);

	constructor(netid: string, first_name: string, last_name: string) {
		this.netid = netid;
		this.first_name = first_name;
		this.last_name = last_name;
		this.programs = new Collection(this);
	}
}
