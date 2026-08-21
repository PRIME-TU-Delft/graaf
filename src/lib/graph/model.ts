import type { Domain, Graph, Lecture, Subject } from '@prisma/client';

/**
 * A graph entity as the store holds it: the plain database row, without its relation arrays.
 * Relations live in the store's edge sets and lecture membership lists instead, keyed by id.
 *
 * Rows are immutable. An update replaces the whole row object rather than mutating it, which is
 * what makes the SvelteMaps they live in report the change (values in a reactive map are not
 * deeply reactive), and what keeps every read out of the store a plain, non-proxied object.
 */
export type DomainRow = Domain;
export type SubjectRow = Subject;
export type LectureRow = Lecture;

/** A directed relation between two entities of the same kind, as `sourceId->targetId`. */
export type EdgeKey = `${number}->${number}`;

/** Build the EdgeKey for a relation from `sourceId` to `targetId`. */
export function edgeKey(sourceId: number, targetId: number): EdgeKey {
	return `${sourceId}->${targetId}`;
}

/** Split an EdgeKey back into the two entity ids it connects. */
export function edgeEnds(key: EdgeKey): { sourceId: number; targetId: number } {
	const [source, target] = key.split('->');
	return { sourceId: Number(source), targetId: Number(target) };
}

/**
 * The payload shape the store hydrates from: what `GraphActions.getRenderablePayload` returns.
 * Relation arrays are only read for their ids, so they are typed as loosely as possible to accept
 * every loader's variant of the payload.
 */
export type GraphPayload = Graph & {
	domains: (Domain & { sourceDomains: { id: number }[]; targetDomains: { id: number }[] })[];
	subjects: (Subject & { sourceSubjects: { id: number }[]; targetSubjects: { id: number }[] })[];
	lectures: (Lecture & { subjects: { id: number }[] })[];
};

/**
 * The payload-shaped projection of the store, for the editor tables, the form components and
 * GraphValidator, all of which were written against the loader's payload.
 *
 * It is derived and read-only: it is rebuilt from the model whenever the model changes, so the
 * duplicated rows inside the relation arrays cannot go stale the way the loader's payload could.
 * Those arrays hold the store's canonical row objects, which carry no relation arrays of their
 * own, so the structure stays free of cycles.
 */
export type GraphWithRelations = Graph & {
	domains: (DomainRow & { sourceDomains: DomainRow[]; targetDomains: DomainRow[] })[];
	subjects: (SubjectRow & {
		domain: DomainRow | null;
		sourceSubjects: SubjectRow[];
		targetSubjects: SubjectRow[];
	})[];
	lectures: (LectureRow & { subjects: SubjectRow[] })[];
};

/**
 * A plain, proxy-free snapshot of the model, and the only input `projectGraphData` accepts.
 * Collections are in display order; relations are id pairs, not object references.
 */
export type GraphModel = {
	id: number;
	domains: DomainRow[];
	subjects: SubjectRow[];
	lectures: (LectureRow & { subjectIds: number[] })[];
	domainEdges: EdgeKey[];
	subjectEdges: EdgeKey[];
};
