import resetDb from './reset-db';
import { beforeEach } from 'vitest';

beforeEach(async () => {
	await resetDb();

	// TODO:
	// Add super admin user & regular user
	// Add program admin, program editor, course admin, course editor
	// Add programs, courses, graphs, domains, subjects, lectures
});
