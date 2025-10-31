import type { RemoteFormField } from '@sveltejs/kit';

export function fieldToIssueString(field: RemoteFormField<string | number>): string {
	const issues = field.issues();

	if (!issues) return '';
	return issues.map((issue) => issue.message).join('\n');
}
