import { displayName } from '$lib/utils/displayUserName';
import type { DataUser } from './userTableColumns';

/**
 * Decide whether a user survives the user table's search box. Matches the name as it is shown in
 * the table or the email address, case-insensitively. An empty or blank needle matches everyone.
 */
export function matchesUserSearch(user: DataUser, filterValue: unknown) {
	const needle = String(filterValue ?? '')
		.trim()
		.toLowerCase();

	if (!needle) return true;

	return (
		displayName(user).toLowerCase().includes(needle) ||
		(user.email ?? '').toLowerCase().includes(needle)
	);
}
