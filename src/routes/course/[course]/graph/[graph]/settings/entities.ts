import { styles } from '$scripts/graph/settings';

export { Course, Graph, Domain, Subject, DomainRelation, SubjectRelation };

class Course {
	code: string;
	name: string;

	constructor(code: string) {
		// TODO load from database

		this.code = code;
		this.name = 'Course Name';
	}
}

class Graph {
	id: number;
	name: string;
	domains: Domain[];
	subjects: Subject[];
	relations: Relation<Field>[];

	constructor(id: number) {
		// TODO load from database

		this.id = id;
		this.name = 'Graph Name';
		this.domains = [];
		this.subjects = [];
		this.relations = [];
	}

	save() {
		// TODO save to database
	}

	delete() {
		// TODO delete from database
	}

	domainRelations(): DomainRelation[] {
		return this.relations.filter(
			(relation) => relation instanceof DomainRelation
		) as DomainRelation[];
	}

	subjectRelations(): SubjectRelation[] {
		return this.relations.filter(
			(relation) => relation instanceof SubjectRelation
		) as SubjectRelation[];
	}

	nextDomainID(): number {
		return this.domains.length > 0 ? Math.max(...this.domains.map((domain) => domain.id)) + 1 : 0;
	}

	nextDomainStyle(): string | undefined {
		const usedStyles = this.domains.map((domain) => domain.style);
		return Object.keys(styles).find((style) => !usedStyles.includes(style));
	}

	nextSubjectID(): number {
		return this.subjects.length > 0
			? Math.max(...this.subjects.map((subject) => subject.id)) + 1
			: 0;
	}
}

abstract class Field {
	id: number;
	x: number;
	y: number;
	graph: Graph;
	name?: string;

	constructor(id: number, x: number, y: number, graph: Graph, name?: string) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.graph = graph;
		this.name = name;
	}

	parents(): Field[] {
		const parents: Field[] = [this];
		for (const relation of this.graph.relations) {
			if (relation.child === this && relation.parent !== undefined) {
				parents.push(...relation.parent.parents());
			}
		}

		return parents;
	}

	children(): Field[] {
		const children: Field[] = [this];
		for (const relation of this.graph.relations) {
			if (relation.parent === this && relation.child !== undefined) {
				children.push(...relation.child.children());
			}
		}

		return children;
	}

	abstract delete(): void;
	abstract color(): string;
}

class Domain extends Field {
	style?: string;

	constructor(id: number, x: number, y: number, graph: Graph, name?: string, style?: string) {
		super(id, x, y, graph, name);
		this.style = style;

		this.graph.domains.push(this);
	}

	static create(graph: Graph): void {
		new Domain(
			graph.nextDomainID(),
			0,
			0, // TODO Calculate position to not overlap
			graph,
			undefined,
			graph.nextDomainStyle()
		);
	}

	delete() {
		this.graph.domains = this.graph.domains.filter((domain) => domain !== this);

		// Unset all subjects with this domain
		for (let subject of this.graph.subjects) {
			if (subject.domain === this) {
				subject.domain = undefined;
			}
		}

		// Unset relations with this domain
		for (let relation of this.graph.relations) {
			if (relation.parent === this) relation.parent = undefined;
			if (relation.child === this) relation.child = undefined;
		}
	}

	color(): string {
		return this.style ? styles[this.style].stroke : 'transparent';
	}
}

class Subject extends Field {
	domain?: Domain;

	constructor(id: number, x: number, y: number, graph: Graph, domain?: Domain, name?: string) {
		super(id, x, y, graph, name);
		this.domain = domain;

		this.graph.subjects.push(this);
	}

	static create(graph: Graph): void {
		new Subject(
			graph.nextSubjectID(),
			0,
			0, // TODO Calculate position to not overlap
			graph
		);
	}

	delete() {
		this.graph.subjects = this.graph.subjects.filter((subject) => subject !== this);

		// Unset relations with this subject
		for (let relation of this.graph.relations) {
			if (relation.parent === this) relation.parent = undefined;
			if (relation.child === this) relation.child = undefined;
		}
	}

	color(): string {
		return this.domain ? this.domain.color() : 'transparent';
	}
}

abstract class Relation<T extends Field> {
	graph: Graph;
	parent?: T;
	child?: T;

	constructor(graph: Graph, parent?: T, child?: T) {
		this.graph = graph;
		this.parent = parent;
		this.child = child;

		this.graph.relations.push(this);
	}

	delete(): void {
		this.graph.relations = this.graph.relations.filter((relation) => relation !== this);
	}

	parentColor(): string {
		return this.parent ? this.parent.color() : 'transparent';
	}

	childColor(): string {
		return this.child ? this.child.color() : 'transparent';
	}

	abstract parentOptions(): { name: string; value: T }[];
	abstract childOptions(): { name: string; value: T }[];
}

class DomainRelation extends Relation<Domain> {
	constructor(graph: Graph, parent?: Domain, child?: Domain) {
		super(graph, parent, child);
	}

	static create(graph: Graph): void {
		new DomainRelation(graph);
	}

	parentOptions(): { name: string; value: Domain }[] {
		// Domain must have a name
		let options = this.graph.domains.filter((domain) => domain.name);

		// Prevent circular references
		if (this.child) {
			let children = this.child.children();
			options = options.filter((domain) => !children.includes(domain));

			// Prevent duplicate relations
			if (!this.parent) {
				options = options.filter(
					(domain) =>
						!this.graph.relations.find(
							(relation) => relation.parent === domain && relation.child === this.child
						)
				);
			}
		}

		return options.map((domain) => ({ name: domain.name!, value: domain }));
	}

	childOptions(): { name: string; value: Domain }[] {
		// Domain must have a name
		let options = this.graph.domains.filter((domain) => domain.name);

		// Prevent circular references
		if (this.parent) {
			let parents = this.parent.parents();
			options = options.filter((domain) => !parents.includes(domain));

			// Prevent duplicate relations
			if (!this.child) {
				options = options.filter(
					(domain) =>
						!this.graph.relations.find(
							(relation) => relation.parent === this.parent && relation.child === domain
						)
				);
			}
		}

		return options.map((domain) => ({ name: domain.name!, value: domain }));
	}
}

class SubjectRelation extends Relation<Subject> {
	constructor(graph: Graph, parent?: Subject, child?: Subject) {
		super(graph, parent, child);
	}

	static create(graph: Graph): void {
		new SubjectRelation(graph);
	}

	parentOptions(): { name: string; value: Subject }[] {
		// Domain must have a name
		let options = this.graph.subjects.filter((subject) => subject.name);

		// Prevent circular references
		if (this.child) {
			let children = this.child.children();
			options = options.filter((subject) => !children.includes(subject));

			// Prevent duplicate relations
			if (!this.parent) {
				options = options.filter(
					(subject) =>
						!this.graph.relations.find(
							(relation) => relation.parent === subject && relation.child === this.child
						)
				);
			}
		}

		return options.map((subject) => ({ name: subject.name!, value: subject }));
	}

	childOptions(): { name: string; value: Subject }[] {
		// Domain must have a name
		let options = this.graph.subjects.filter((subject) => subject.name);

		// Prevent circular references
		if (this.parent) {
			let parents = this.parent.parents();
			options = options.filter((subject) => !parents.includes(subject));

			// Prevent duplicate relations
			if (!this.child) {
				options = options.filter(
					(subject) =>
						!this.graph.relations.find(
							(relation) => relation.parent === this.parent && relation.child === subject
						)
				);
			}
		}

		return options.map((subject) => ({ name: subject.name!, value: subject }));
	}
}
