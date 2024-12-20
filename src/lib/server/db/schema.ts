import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const program = pgTable('program', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull()
});

export const course = pgTable('course', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	type: text('type'),
	description: text('description').notNull(),
	programId: serial('program_id')
		.notNull()
		.references(() => program.id)
});
