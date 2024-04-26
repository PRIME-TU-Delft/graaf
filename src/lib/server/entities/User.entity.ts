import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity()
export class User {
	@PrimaryKey()
	id: string = uuid();

	@Property()
	username: string;

	@Property()
	name: string;

	constructor(username: string, name: string) {
		this.username = username;
		this.name = name;
	}
}
