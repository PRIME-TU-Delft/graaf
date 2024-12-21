import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const program = pgTable('program', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull()
});

export const course = pgTable('course', {
	code: varchar('code', { length: 255 }).notNull().primaryKey(),
	name: text('name').notNull(),
	programId: uuid('program_id')
		.notNull()
		.references(() => program.id)
});
