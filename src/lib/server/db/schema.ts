import { relations } from 'drizzle-orm';
import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const program = pgTable('program', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull()
});

export const course = pgTable('course', {
	code: varchar('code', { length: 255 }).notNull().unique().primaryKey(),
	name: text('name').notNull()
});

export const programsToCourses = pgTable('programsToCourses', {
	programId: uuid('program_id')
		.defaultRandom()
		.references(() => program.id),
	courseCode: varchar('course_code', { length: 255 })
		.notNull()
		.references(() => course.code)
});

// Relationship definitions
export const programRelations = relations(program, ({ many }) => ({
	courses: many(course)
}));

export const courseRelations = relations(course, ({ many }) => ({
	program: many(program)
}));

export const programsToCoursesRelations = relations(programsToCourses, ({ one }) => ({
	program: one(program, { fields: [programsToCourses.programId], references: [program.id] }),
	course: one(course, { fields: [programsToCourses.courseCode], references: [course.code] })
}));
