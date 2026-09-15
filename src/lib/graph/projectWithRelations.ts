import { edgeEnds } from './model';

import type { Graph } from '@prisma/client';
import type { DomainRow, GraphModel, GraphWithRelations, SubjectRow } from './model';

/**
 * Project the store's model into the payload shape the editor tables, the form components and
 * GraphValidator were written against: rows carrying their relations as arrays, the way the loader
 * returns them.
 *
 * The relation arrays hold the model's canonical row objects, which carry no relation arrays of
 * their own. That keeps the result acyclic, and it means a name can only be shown from one place,
 * unlike the loader's payload where every relation is a separate copy of the row.
 *
 * @param meta - The graph's own fields
 * @param model - The model snapshot to project, with collections already in display order
 */
export function projectWithRelations(meta: Graph, model: GraphModel): GraphWithRelations {
	const domainRows = new Map(model.domains.map((row) => [row.id, row]));
	const subjectRows = new Map(model.subjects.map((row) => [row.id, row]));

	const domains = model.domains.map((row) => ({
		...row,
		sourceDomains: [] as DomainRow[],
		targetDomains: [] as DomainRow[]
	}));

	const domainById = new Map(domains.map((domain) => [domain.id, domain]));
	for (const key of model.domainEdges) {
		const { sourceId, targetId } = edgeEnds(key);
		const source = domainById.get(sourceId);
		const target = domainById.get(targetId);
		const sourceRow = domainRows.get(sourceId);
		const targetRow = domainRows.get(targetId);
		if (!source || !target || !sourceRow || !targetRow) continue;

		source.targetDomains.push(targetRow);
		target.sourceDomains.push(sourceRow);
	}

	const subjects = model.subjects.map((row) => ({
		...row,
		domain: row.domainId === null ? null : (domainRows.get(row.domainId) ?? null),
		sourceSubjects: [] as SubjectRow[],
		targetSubjects: [] as SubjectRow[]
	}));

	const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
	for (const key of model.subjectEdges) {
		const { sourceId, targetId } = edgeEnds(key);
		const source = subjectById.get(sourceId);
		const target = subjectById.get(targetId);
		const sourceRow = subjectRows.get(sourceId);
		const targetRow = subjectRows.get(targetId);
		if (!source || !target || !sourceRow || !targetRow) continue;

		source.targetSubjects.push(targetRow);
		target.sourceSubjects.push(sourceRow);
	}

	const lectures = model.lectures.map(({ subjectIds, ...row }) => ({
		...row,
		subjects: subjectIds.flatMap((id) => subjectRows.get(id) ?? [])
	}));

	return { ...meta, domains, subjects, lectures };
}
