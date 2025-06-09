import * as d3 from 'd3';
import { Prisma } from '@prisma/client';

import * as settings from '$lib/settings';

export { NodeType };
export type {
	PrismaGraphPayload,
	PrismaDomainPayload,
	PrismaSubjectPayload,
	PrismaLecturePayload,
	GraphData,
	NodeData,
	EdgeData,
	LectureData,
	CameraTransform,
	SVGSelection,
	DefsSelection,
	GroupSelection,
	NodeSelection,
	EdgeSelection
};

// -----------------------------> Enums

// Node types
enum NodeType {
	DOMAIN = 'domain',
	SUBJECT = 'subject'
}

// -----------------------------> Types

// Minimal graph payload for injection
type PrismaGraphPayload = Prisma.GraphGetPayload<{
	include: {
		domains: {
			include: {
				sourceDomains: true;
				targetDomains: true;
			};
		};
		subjects: {
			include: {
				sourceSubjects: true;
				targetSubjects: true;
			};
		};
		lectures: {
			include: {
				subjects: true;
			};
		};
	};
}>;

// Minimal domain payload for injection
type PrismaDomainPayload = Prisma.DomainGetPayload<{
	include: {
		sourceDomains: true;
		targetDomains: true;
	};
}>;

// Minimal subject payload for injection
type PrismaSubjectPayload = Prisma.SubjectGetPayload<{
	include: {
		sourceSubjects: true;
		targetSubjects: true;
	};
}>;

// Minimal lecture payload for injection
type PrismaLecturePayload = Prisma.LectureGetPayload<{
	include: {
		subjects: true;
	};
}>;

// Abstraction for graphs
type GraphData = {
	domain_nodes: NodeData[];
	domain_edges: EdgeData[];
	subject_nodes: NodeData[];
	subject_edges: EdgeData[];
	lectures: LectureData[];
};

// Abstraction for domains and subjects
type NodeData = {
	id: number;
	uuid: string;
	type: NodeType;
	style: keyof typeof settings.STYLES | null;
	text: string;
	x: number;
	y: number;

	// Parent domain - used for subjects
	parent?: NodeData;

	// Fixed position - used for simulation
	fx?: number;
	fy?: number;
};

// Abstraction for relations
type EdgeData = {
	uuid: string;
	source: NodeData;
	target: NodeData;
};

// Abstraction for lectures
type LectureData = {
	id: number;
	name: string;
	past_nodes: NodeData[]; // Subjects required for this lecture
	present_nodes: NodeData[]; // Subjects covered in this lecture
	future_nodes: NodeData[]; // Subjects that will follow this lecture

	domains: NodeData[]; // Domains covered in this lecture
	nodes: NodeData[]; // All nodes in this lecture
	edges: EdgeData[]; // All edges in this lecture
};

// Camera transform
type CameraTransform = {
	x: number;
	y: number;
	k: number;
};

// D3 selection types
type SVGSelection = d3.Selection<SVGSVGElement, unknown, null, unknown>;
type DefsSelection = d3.Selection<SVGDefsElement, unknown, null, unknown>;
type GroupSelection = d3.Selection<SVGGElement, unknown, null, unknown>;
type NodeSelection = d3.Selection<SVGGElement, NodeData, d3.BaseType, unknown>;
type EdgeSelection = d3.Selection<SVGLineElement, EdgeData, d3.BaseType, unknown>;
