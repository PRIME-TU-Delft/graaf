import { edgeKey } from './model';

import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Graph } from '@prisma/client';
import type { DomainRow, EdgeKey, GraphPayload, LectureRow, SubjectRow } from './model';

/**
 * Turning a loaded payload into the graph store's model: one row builder per entity, stripping the
 * relation arrays that the store keeps as id pairs instead, and the reconcilers that fold those
 * rows into the store's collections.
 *
 * Kept out of the store itself so it stays pure and testable, and so the plain Maps and Sets used
 * here are not mistaken for reactive state.
 */

/**
 * Whether two rows carry the same values. Dates and scalar lists (`Lecture.subjectOrder`) are
 * compared by value rather than identity, since every load revives new objects for them and
 * comparing by identity would make every row look changed.
 */
export function sameRow<Row extends object>(a: Row, b: Row): boolean {
	const keys = Object.keys(a) as (keyof Row)[];
	if (keys.length !== Object.keys(b).length) return false;

	return keys.every((key) => {
		const left = a[key];
		const right = b[key];
		if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
		if (Array.isArray(left) && Array.isArray(right)) {
			return left.length === right.length && left.every((item, index) => item === right[index]);
		}

		return left === right;
	});
}

/** Whether two id lists hold the same ids in the same order. */
export function sameIds(a: number[] | undefined, b: number[]): boolean {
	return a !== undefined && a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Fold incoming rows into a collection: replace the rows whose contents changed, insert new ones,
 * delete the ones that are gone. Rows that did not change keep their object identity, so a reload
 * only invalidates what actually moved.
 *
 * @returns Whether anything changed
 */
export function reconcileRows<Row extends { id: number }>(
	rows: SvelteMap<number, Row>,
	incoming: Row[]
): boolean {
	let changed = false;

	const ids = new Set<number>();
	for (const row of incoming) {
		ids.add(row.id);

		const current = rows.get(row.id);
		if (current && sameRow(current, row)) continue;

		rows.set(row.id, row);
		changed = true;
	}

	for (const id of [...rows.keys()]) {
		if (ids.has(id)) continue;

		rows.delete(id);
		changed = true;
	}

	return changed;
}

/**
 * Fold the payload's relation arrays into a set of id pairs, adding what is new and dropping what
 * is gone. Existing keys are left alone, so the display order of the relation tables is stable
 * across reloads.
 *
 * @param edges - The edge set to reconcile
 * @param sources - The entities the relations hang off
 * @param targetsOf - Reads one entity's outgoing relations
 * @returns Whether anything changed
 */
export function reconcileEdges<Source extends { id: number }>(
	edges: SvelteSet<EdgeKey>,
	sources: Source[],
	targetsOf: (source: Source) => { id: number }[]
): boolean {
	const incoming = new Set<EdgeKey>();
	for (const source of sources) {
		for (const target of targetsOf(source)) {
			incoming.add(edgeKey(source.id, target.id));
		}
	}

	let changed = false;
	for (const key of incoming) {
		if (edges.has(key)) continue;

		edges.add(key);
		changed = true;
	}

	for (const key of [...edges]) {
		if (incoming.has(key)) continue;

		edges.delete(key);
		changed = true;
	}

	return changed;
}

/** The graph's own fields, without any of its contents. */
export function graphMeta(payload: GraphPayload): Graph {
	return {
		id: payload.id,
		name: payload.name,
		parentType: payload.parentType,
		courseId: payload.courseId,
		sandboxId: payload.sandboxId,
		createdAt: payload.createdAt,
		updatedAt: payload.updatedAt
	};
}

/** One domain row, without its relation arrays. Built field by field, so nothing the payload
 *  happens to carry leaks into the model. */
export function domainRow(domain: GraphPayload['domains'][number]): DomainRow {
	return {
		id: domain.id,
		name: domain.name,
		style: domain.style,
		order: domain.order,
		x: domain.x,
		y: domain.y,
		graphId: domain.graphId,
		createdAt: domain.createdAt,
		updatedAt: domain.updatedAt
	};
}

/** One subject row, without its relation arrays or its parent domain. */
export function subjectRow(subject: GraphPayload['subjects'][number]): SubjectRow {
	return {
		id: subject.id,
		name: subject.name,
		order: subject.order,
		x: subject.x,
		y: subject.y,
		graphId: subject.graphId,
		domainId: subject.domainId,
		createdAt: subject.createdAt,
		updatedAt: subject.updatedAt
	};
}

/**
 * One lecture row, without its subjects. `subjectOrder` is the persisted display order of those
 * subjects; the loader sorts `lecture.subjects` by it, so the store reads the order from there and
 * keeps this field only so the row stays a faithful copy of the database row.
 */
export function lectureRow(lecture: GraphPayload['lectures'][number]): LectureRow {
	return {
		id: lecture.id,
		name: lecture.name,
		order: lecture.order,
		subjectOrder: lecture.subjectOrder,
		graphId: lecture.graphId,
		createdAt: lecture.createdAt,
		updatedAt: lecture.updatedAt
	};
}
