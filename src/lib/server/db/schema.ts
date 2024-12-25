import { relations } from 'drizzle-orm';
import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const program = pgTable('program', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull()
});

export const programRelations = relations(program, ({ many }) => ({
	courses: many(course)
}));

export const course = pgTable('course', {
	code: varchar('code', { length: 255 }).unique().notNull().primaryKey(),
	name: text('name').notNull(),
	programId: uuid('program_id')
		.notNull()
		.references(() => program.id)
});

export const courseRelations = relations(course, ({ one }) => ({
	program: one(program, { fields: [course.programId], references: [program.id] })
}));
