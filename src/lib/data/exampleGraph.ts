import type { RenderableGraph } from '$lib/graph/renderablePayload';

/**
 * The literal below leaves out each subject's parent `domain`, which the real query includes: it is
 * filled in from `domainId` when the graph is exported, so the fixture does not have to repeat every
 * domain row inside every subject that belongs to it.
 */
type ExampleGraph = Omit<RenderableGraph, 'subjects'> & {
	subjects: Omit<RenderableGraph['subjects'][number], 'domain'>[];
};

const graph: ExampleGraph = {
	id: 1,
	name: 'AM101: Linear Algebra & Calculus',
	courseId: 1,
	sandboxId: null,
	parentType: 'COURSE',
	createdAt: new Date('2025-01-01T00:00:00.000Z'),
	updatedAt: new Date('2025-01-01T00:00:00.000Z'),
	domains: [
		{
			id: 1,
			name: 'Linear Systems',
			style: 'CONFIDENT_TURQUOISE',
			order: 0,
			x: -24,
			y: -10,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [],
			targetDomains: [
				{
					id: 2,
					name: 'Matrix Theory',
					style: 'MYSTERIOUS_BLUE',
					order: 1,
					x: 0,
					y: -12,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 2,
			name: 'Matrix Theory',
			style: 'MYSTERIOUS_BLUE',
			order: 1,
			x: 0,
			y: -12,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [
				{
					id: 1,
					name: 'Linear Systems',
					style: 'CONFIDENT_TURQUOISE',
					order: 0,
					x: -24,
					y: -10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetDomains: [
				{
					id: 5,
					name: 'Vector Spaces & Geometry',
					style: 'ELECTRIC_GREEN',
					order: 4,
					x: 24,
					y: -10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 3,
			name: 'Single-Variable Calculus',
			style: 'SUNNY_YELLOW',
			order: 2,
			x: -24,
			y: 10,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [],
			targetDomains: [
				{
					id: 4,
					name: 'Multivariable Calculus',
					style: 'ENERGIZING_ORANGE',
					order: 3,
					x: 0,
					y: 12,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 6,
					name: 'Differential Equations',
					style: 'PROSPEROUS_RED',
					order: 5,
					x: 48,
					y: 0,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 4,
			name: 'Multivariable Calculus',
			style: 'ENERGIZING_ORANGE',
			order: 3,
			x: 0,
			y: 12,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [
				{
					id: 3,
					name: 'Single-Variable Calculus',
					style: 'SUNNY_YELLOW',
					order: 2,
					x: -24,
					y: 10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetDomains: [
				{
					id: 7,
					name: 'Vector Calculus',
					style: 'MAJESTIC_PURPLE',
					order: 6,
					x: 24,
					y: 10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 5,
			name: 'Vector Spaces & Geometry',
			style: 'ELECTRIC_GREEN',
			order: 4,
			x: 24,
			y: -10,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [
				{
					id: 2,
					name: 'Matrix Theory',
					style: 'MYSTERIOUS_BLUE',
					order: 1,
					x: 0,
					y: -12,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetDomains: [
				{
					id: 6,
					name: 'Differential Equations',
					style: 'PROSPEROUS_RED',
					order: 5,
					x: 48,
					y: 0,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 6,
			name: 'Differential Equations',
			style: 'PROSPEROUS_RED',
			order: 5,
			x: 48,
			y: 0,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [
				{
					id: 3,
					name: 'Single-Variable Calculus',
					style: 'SUNNY_YELLOW',
					order: 2,
					x: -24,
					y: 10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 5,
					name: 'Vector Spaces & Geometry',
					style: 'ELECTRIC_GREEN',
					order: 4,
					x: 24,
					y: -10,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetDomains: []
		},
		{
			id: 7,
			name: 'Vector Calculus',
			style: 'MAJESTIC_PURPLE',
			order: 6,
			x: 24,
			y: 10,
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceDomains: [
				{
					id: 4,
					name: 'Multivariable Calculus',
					style: 'ENERGIZING_ORANGE',
					order: 3,
					x: 0,
					y: 12,
					graphId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetDomains: []
		}
	],
	subjects: [
		// Domain 1: Linear Systems (3 subjects)
		{
			id: 1,
			name: 'Linear Systems & Geometry',
			order: 0,
			x: -48,
			y: -24,
			graphId: 1,
			domainId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [],
			targetSubjects: [
				{
					id: 2,
					name: 'Gaussian Elimination',
					order: 1,
					x: -22,
					y: -24,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 2,
			name: 'Gaussian Elimination',
			order: 1,
			x: -22,
			y: -24,
			graphId: 1,
			domainId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 1,
					name: 'Linear Systems & Geometry',
					order: 0,
					x: -48,
					y: -24,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 3,
					name: 'Echelon Forms & Pivots',
					order: 2,
					x: -35,
					y: -10,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 3,
			name: 'Echelon Forms & Pivots',
			order: 2,
			x: -35,
			y: -10,
			graphId: 1,
			domainId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 2,
					name: 'Gaussian Elimination',
					order: 1,
					x: -22,
					y: -24,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 4,
					name: 'Matrix Operations',
					order: 3,
					x: -8,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 7,
					name: 'Rank & Nullity',
					order: 6,
					x: 18,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},

		// Domain 2: Matrix Theory (4 subjects)
		{
			id: 4,
			name: 'Matrix Operations',
			order: 3,
			x: -8,
			y: -30,
			graphId: 1,
			domainId: 2,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 3,
					name: 'Echelon Forms & Pivots',
					order: 2,
					x: -35,
					y: -10,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 5,
					name: 'Matrix Inverse & Transpose',
					order: 4,
					x: 18,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 6,
					name: 'Determinants & Minors',
					order: 5,
					x: -8,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 5,
			name: 'Matrix Inverse & Transpose',
			order: 4,
			x: 18,
			y: -30,
			graphId: 1,
			domainId: 2,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 4,
					name: 'Matrix Operations',
					order: 3,
					x: -8,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 16,
					name: 'Linear Transformations',
					order: 15,
					x: 44,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 6,
			name: 'Determinants & Minors',
			order: 5,
			x: -8,
			y: -12,
			graphId: 1,
			domainId: 2,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 4,
					name: 'Matrix Operations',
					order: 3,
					x: -8,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 7,
			name: 'Rank & Nullity',
			order: 6,
			x: 18,
			y: -12,
			graphId: 1,
			domainId: 2,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 3,
					name: 'Echelon Forms & Pivots',
					order: 2,
					x: -35,
					y: -10,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 14,
					name: 'Vector Subspaces & Span',
					order: 13,
					x: 44,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},

		// Domain 3: Single-Variable Calculus (3 subjects)
		{
			id: 8,
			name: 'Limits & Continuity',
			order: 7,
			x: -48,
			y: 12,
			graphId: 1,
			domainId: 3,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [],
			targetSubjects: [
				{
					id: 9,
					name: 'Derivatives & Chain Rule',
					order: 8,
					x: -22,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 9,
			name: 'Derivatives & Chain Rule',
			order: 8,
			x: -22,
			y: 12,
			graphId: 1,
			domainId: 3,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 8,
					name: 'Limits & Continuity',
					order: 7,
					x: -48,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 10,
					name: 'Integration Techniques',
					order: 9,
					x: -35,
					y: 26,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 11,
					name: 'Partial Derivatives',
					order: 10,
					x: -8,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 10,
			name: 'Integration Techniques',
			order: 9,
			x: -35,
			y: 26,
			graphId: 1,
			domainId: 3,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 9,
					name: 'Derivatives & Chain Rule',
					order: 8,
					x: -22,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 13,
					name: 'Multiple Integrals',
					order: 12,
					x: 5,
					y: 26,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 21,
					name: 'First-Order ODEs',
					order: 20,
					x: 94,
					y: 2,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},

		// Domain 4: Multivariable Calculus (3 subjects)
		{
			id: 11,
			name: 'Partial Derivatives',
			order: 10,
			x: -8,
			y: 10,
			graphId: 1,
			domainId: 4,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 9,
					name: 'Derivatives & Chain Rule',
					order: 8,
					x: -22,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 12,
					name: 'Gradient & Directions',
					order: 11,
					x: 18,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 12,
			name: 'Gradient & Directions',
			order: 11,
			x: 18,
			y: 10,
			graphId: 1,
			domainId: 4,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 11,
					name: 'Partial Derivatives',
					order: 10,
					x: -8,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 18,
					name: 'Vector Fields & Divergence',
					order: 17,
					x: 36,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 13,
			name: 'Multiple Integrals',
			order: 12,
			x: 5,
			y: 26,
			graphId: 1,
			domainId: 4,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 10,
					name: 'Integration Techniques',
					order: 9,
					x: -35,
					y: 26,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 19,
					name: 'Line & Surface Integrals',
					order: 18,
					x: 62,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},

		// Domain 5: Vector Spaces & Geometry (4 subjects)
		{
			id: 14,
			name: 'Vector Subspaces & Span',
			order: 13,
			x: 44,
			y: -30,
			graphId: 1,
			domainId: 5,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 7,
					name: 'Rank & Nullity',
					order: 6,
					x: 18,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 15,
					name: 'Linear Independence & Basis',
					order: 14,
					x: 70,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 15,
			name: 'Linear Independence & Basis',
			order: 14,
			x: 70,
			y: -30,
			graphId: 1,
			domainId: 5,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 14,
					name: 'Vector Subspaces & Span',
					order: 13,
					x: 44,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 17,
					name: 'Orthogonality & Projections',
					order: 16,
					x: 70,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 16,
			name: 'Linear Transformations',
			order: 15,
			x: 44,
			y: -12,
			graphId: 1,
			domainId: 5,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 5,
					name: 'Matrix Inverse & Transpose',
					order: 4,
					x: 18,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 17,
			name: 'Orthogonality & Projections',
			order: 16,
			x: 70,
			y: -12,
			graphId: 1,
			domainId: 5,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 15,
					name: 'Linear Independence & Basis',
					order: 14,
					x: 70,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},

		// Domain 7: Vector Calculus (2 subjects)
		{
			id: 18,
			name: 'Vector Fields & Divergence',
			order: 17,
			x: 36,
			y: 18,
			graphId: 1,
			domainId: 7,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 12,
					name: 'Gradient & Directions',
					order: 11,
					x: 18,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 19,
					name: 'Line & Surface Integrals',
					order: 18,
					x: 62,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 19,
			name: 'Line & Surface Integrals',
			order: 18,
			x: 62,
			y: 18,
			graphId: 1,
			domainId: 7,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 13,
					name: 'Multiple Integrals',
					order: 12,
					x: 5,
					y: 26,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 18,
					name: 'Vector Fields & Divergence',
					order: 17,
					x: 36,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: []
		},

		// Domain 6: Differential Equations (3 subjects)
		{
			id: 20,
			name: 'Eigenvalues & Eigenvectors',
			order: 19,
			x: 94,
			y: -16,
			graphId: 1,
			domainId: 6,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 6,
					name: 'Determinants & Minors',
					order: 5,
					x: -8,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 15,
					name: 'Linear Independence & Basis',
					order: 14,
					x: 70,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 16,
					name: 'Linear Transformations',
					order: 15,
					x: 44,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 17,
					name: 'Orthogonality & Projections',
					order: 16,
					x: 70,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 22,
					name: 'Systems of Linear ODEs',
					order: 21,
					x: 94,
					y: 20,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 21,
			name: 'First-Order ODEs',
			order: 20,
			x: 94,
			y: 2,
			graphId: 1,
			domainId: 6,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 10,
					name: 'Integration Techniques',
					order: 9,
					x: -35,
					y: 26,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: [
				{
					id: 22,
					name: 'Systems of Linear ODEs',
					order: 21,
					x: 94,
					y: 20,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 22,
			name: 'Systems of Linear ODEs',
			order: 21,
			x: 94,
			y: 20,
			graphId: 1,
			domainId: 6,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			sourceSubjects: [
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 21,
					name: 'First-Order ODEs',
					order: 20,
					x: 94,
					y: 2,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			],
			targetSubjects: []
		}
	],
	lectures: [
		{
			id: 1,
			name: 'Week 1: Linear Systems & Foundations',
			order: 0,
			subjectOrder: [1, 2, 8],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 1,
					name: 'Linear Systems & Geometry',
					order: 0,
					x: -48,
					y: -24,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 2,
					name: 'Gaussian Elimination',
					order: 1,
					x: -22,
					y: -24,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 8,
					name: 'Limits & Continuity',
					order: 7,
					x: -48,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 2,
			name: 'Week 2: Matrices & Differentiation',
			order: 1,
			subjectOrder: [3, 4, 9],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 3,
					name: 'Echelon Forms & Pivots',
					order: 2,
					x: -35,
					y: -10,
					graphId: 1,
					domainId: 1,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 4,
					name: 'Matrix Operations',
					order: 3,
					x: -8,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 9,
					name: 'Derivatives & Chain Rule',
					order: 8,
					x: -22,
					y: 12,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 3,
			name: 'Week 3: Inverses, Determinants & Integrals',
			order: 2,
			subjectOrder: [5, 6, 7, 10],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 5,
					name: 'Matrix Inverse & Transpose',
					order: 4,
					x: 18,
					y: -30,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 6,
					name: 'Determinants & Minors',
					order: 5,
					x: -8,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 7,
					name: 'Rank & Nullity',
					order: 6,
					x: 18,
					y: -12,
					graphId: 1,
					domainId: 2,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 10,
					name: 'Integration Techniques',
					order: 9,
					x: -35,
					y: 26,
					graphId: 1,
					domainId: 3,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 4,
			name: 'Week 4: Multivariable Calculus & Subspaces',
			order: 3,
			subjectOrder: [11, 12, 14, 15],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 11,
					name: 'Partial Derivatives',
					order: 10,
					x: -8,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 12,
					name: 'Gradient & Directions',
					order: 11,
					x: 18,
					y: 10,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 14,
					name: 'Vector Subspaces & Span',
					order: 13,
					x: 44,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 15,
					name: 'Linear Independence & Basis',
					order: 14,
					x: 70,
					y: -30,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 5,
			name: 'Week 5: Vector Calculus & Transformations',
			order: 4,
			subjectOrder: [13, 16, 17, 18],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 13,
					name: 'Multiple Integrals',
					order: 12,
					x: 5,
					y: 26,
					graphId: 1,
					domainId: 4,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 16,
					name: 'Linear Transformations',
					order: 15,
					x: 44,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 17,
					name: 'Orthogonality & Projections',
					order: 16,
					x: 70,
					y: -12,
					graphId: 1,
					domainId: 5,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 18,
					name: 'Vector Fields & Divergence',
					order: 17,
					x: 36,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		},
		{
			id: 6,
			name: 'Week 6: Eigenvalues & Systems of ODEs',
			order: 5,
			subjectOrder: [19, 20, 21, 22],
			graphId: 1,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
			subjects: [
				{
					id: 19,
					name: 'Line & Surface Integrals',
					order: 18,
					x: 62,
					y: 18,
					graphId: 1,
					domainId: 7,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 20,
					name: 'Eigenvalues & Eigenvectors',
					order: 19,
					x: 94,
					y: -16,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 21,
					name: 'First-Order ODEs',
					order: 20,
					x: 94,
					y: 2,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				},
				{
					id: 22,
					name: 'Systems of Linear ODEs',
					order: 21,
					x: 94,
					y: 20,
					graphId: 1,
					domainId: 6,
					createdAt: new Date('2025-01-01T00:00:00.000Z'),
					updatedAt: new Date('2025-01-01T00:00:00.000Z')
				}
			]
		}
	]
};

/** A stand-in for a graph fetched with `renderableGraphInclude`, used by the landing page's
 *  embedded example at `/graph/example`. */
export const exampleGraph: RenderableGraph = {
	...graph,
	subjects: graph.subjects.map((subject) => ({
		...subject,
		domain: graph.domains.find((domain) => domain.id === subject.domainId) ?? null
	}))
};
