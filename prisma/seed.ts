import {
	PrismaClient,
	ParentType,
	DomainStyle,
	type Course,
	type Domain,
	type Subject
} from '@prisma/client';
import { courses, programs } from './init';
import { env } from 'process';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const testUsers = [
	{ fn: 'Abel', ln: 'de Bruijn', admin: true },
	{ fn: 'Bram', ln: 'Kreulen', admin: true },
	{ fn: 'Julia', ln: 'van der Kris', admin: true },
	{ fn: 'Beryl', ln: 'van Gelderen', admin: true },
	{ fn: 'Fokko', ln: 'van de Bult', admin: false },
	{ fn: 'Boris', ln: 'Pavic', admin: false },
	{ fn: 'Teun', ln: 'Janssen', admin: false },
	{ fn: 'Dani', ln: 'Petrova', admin: false },
	{ fn: 'Rens', ln: 'Dur', admin: false },
	{ fn: 'Dennis', ln: 'den Ouden-van der Horst', admin: false },
	{ fn: 'Test User', ln: 'One', admin: false },
	{ fn: 'Test User', ln: 'Two', admin: false },
	{ fn: 'Test User', ln: 'Three', admin: false },
	{ fn: 'Test User', ln: 'Four', admin: false }
];

async function main() {
	console.log('Start seeding ...');

	await prisma.$transaction([
		prisma.link.deleteMany(),
		prisma.domain.deleteMany(),
		prisma.subject.deleteMany(),
		prisma.lecture.deleteMany(),
		prisma.graph.deleteMany(),
		prisma.course.deleteMany(),
		prisma.sandbox.deleteMany(),
		prisma.program.deleteMany(),
		prisma.session.deleteMany(),
		prisma.account.deleteMany(),
		prisma.user.deleteMany()
	]);

	if (env.NETLIFY_CONTEXT != 'PROD') {
		const users = testUsers.map((user) => {
			const email =
				user.fn.replaceAll(' ', '').toLowerCase() + user.ln.replaceAll(' ', '_').toLowerCase();

			return prisma.user.create({
				data: {
					role: user.admin ? 'ADMIN' : 'USER',
					email: `${email}@tudelft.nl`,
					nickname: user.fn + ' ' + user.ln,
					firstName: user.fn,
					lastName: user.ln,
					emailVerified: new Date(),
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});
		});

		await prisma.$transaction(users);
	}

	const userBram = await prisma.user.findFirstOrThrow({
		where: {
			firstName: 'Bram'
		}
	});

	const userJulia = await prisma.user.findFirstOrThrow({
		where: {
			firstName: 'Julia'
		}
	});

	const sandboxes = [
		prisma.sandbox.create({
			data: {
				name: 'SandboxOne',
				ownerId: userBram.id
			}
		}),
		prisma.sandbox.create({
			data: {
				name: 'SandboxTwo',
				ownerId: userBram.id
			}
		}),
		prisma.sandbox.create({
			data: {
				name: 'SandboxThree',
				ownerId: userJulia.id
			}
		})
	];

	const prisma_sandboxes = await prisma.$transaction(sandboxes);
	await prisma.sandbox.update({
		where: {
			id: prisma_sandboxes.find((sandbox) => sandbox.ownerId === userJulia.id)!.id
		},
		data: {
			editors: {
				connect: [
					{
						id: userBram.id
					}
				]
			}
		}
	});

	const prisma_courses: Course[] = [];
	for (const course of courses) {
		const prisma_course = await prisma.course.create({
			data: {
				...course,
				admins: {
					connect: [{ id: userBram.id }]
				},
				editors: {
					connect: [{ id: userJulia.id }]
				}
			}
		});

		prisma_courses.push(prisma_course);
		console.log(`Created course with code: ${prisma_course.code}`);
	}

	console.log('\n');

	for (const program of programs) {
		const prisma_program = await prisma.program.create({
			data: {
				name: program.name,
				courses: {
					connect: program.courses.map((course) => {
						return {
							code: course.code
						};
					})
				}
			}
		});

		console.log(`Created program with id: ${prisma_program.id}`);
	}

	console.log('\n');

	// -----------------------------> Example Graph: AM101 Linear Algebra & Calculus
	const targetCourse = prisma_courses.find((c) => c.code === 'AM101') ?? prisma_courses[0];

	const graph = await prisma.graph.create({
		data: {
			name: 'AM101: Linear Algebra & Calculus',
			courseId: targetCourse.id,
			parentType: ParentType.COURSE
		}
	});

	console.log(`Created graph with id: ${graph.id} for course: ${targetCourse.code}`);

	// Create public viewer links
	await prisma.link.create({
		data: {
			name: 'default',
			courseId: targetCourse.id,
			graphId: graph.id,
			parentType: ParentType.COURSE
		}
	});

	await prisma.link.create({
		data: {
			name: 'main',
			courseId: targetCourse.id,
			graphId: graph.id,
			parentType: ParentType.COURSE
		}
	});

	// Seed Domains
	const domainData = [
		{
			key: 1,
			name: 'Linear Systems',
			style: DomainStyle.CONFIDENT_TURQUOISE,
			order: 0,
			x: -24,
			y: -10
		},
		{ key: 2, name: 'Matrix Theory', style: DomainStyle.MYSTERIOUS_BLUE, order: 1, x: 0, y: -12 },
		{
			key: 3,
			name: 'Single-Variable Calculus',
			style: DomainStyle.SUNNY_YELLOW,
			order: 2,
			x: -24,
			y: 10
		},
		{
			key: 4,
			name: 'Multivariable Calculus',
			style: DomainStyle.ENERGIZING_ORANGE,
			order: 3,
			x: 0,
			y: 12
		},
		{
			key: 5,
			name: 'Vector Spaces & Geometry',
			style: DomainStyle.ELECTRIC_GREEN,
			order: 4,
			x: 24,
			y: -10
		},
		{
			key: 6,
			name: 'Differential Equations',
			style: DomainStyle.PROSPEROUS_RED,
			order: 5,
			x: 48,
			y: 0
		},
		{ key: 7, name: 'Vector Calculus', style: DomainStyle.MAJESTIC_PURPLE, order: 6, x: 24, y: 10 }
	];

	const domainMap = new Map<number, Domain>();
	for (const d of domainData) {
		const created = await prisma.domain.create({
			data: {
				name: d.name,
				style: d.style,
				order: d.order,
				x: d.x,
				y: d.y,
				graphId: graph.id
			}
		});
		domainMap.set(d.key, created);
	}

	// Seed Domain Relations (Edges)
	const domainEdges = [
		{ source: 1, target: 2 },
		{ source: 2, target: 5 },
		{ source: 3, target: 4 },
		{ source: 3, target: 6 },
		{ source: 4, target: 7 },
		{ source: 5, target: 6 }
	];

	for (const edge of domainEdges) {
		const sourceDomain = domainMap.get(edge.source)!;
		const targetDomain = domainMap.get(edge.target)!;
		await prisma.domain.update({
			where: { id: sourceDomain.id },
			data: {
				targetDomains: {
					connect: { id: targetDomain.id }
				}
			}
		});
	}

	// Seed Subjects
	const subjectData = [
		// Domain 1: Linear Systems
		{ key: 1, domainKey: 1, name: 'Linear Systems & Geometry', order: 0, x: -48, y: -24 },
		{ key: 2, domainKey: 1, name: 'Gaussian Elimination', order: 1, x: -22, y: -24 },
		{ key: 3, domainKey: 1, name: 'Echelon Forms & Pivots', order: 2, x: -35, y: -10 },

		// Domain 2: Matrix Theory
		{ key: 4, domainKey: 2, name: 'Matrix Operations', order: 3, x: -8, y: -30 },
		{ key: 5, domainKey: 2, name: 'Matrix Inverse & Transpose', order: 4, x: 18, y: -30 },
		{ key: 6, domainKey: 2, name: 'Determinants & Minors', order: 5, x: -8, y: -12 },
		{ key: 7, domainKey: 2, name: 'Rank & Nullity', order: 6, x: 18, y: -12 },

		// Domain 3: Single-Variable Calculus
		{ key: 8, domainKey: 3, name: 'Limits & Continuity', order: 7, x: -48, y: 12 },
		{ key: 9, domainKey: 3, name: 'Derivatives & Chain Rule', order: 8, x: -22, y: 12 },
		{ key: 10, domainKey: 3, name: 'Integration Techniques', order: 9, x: -35, y: 26 },

		// Domain 4: Multivariable Calculus
		{ key: 11, domainKey: 4, name: 'Partial Derivatives', order: 10, x: -8, y: 10 },
		{ key: 12, domainKey: 4, name: 'Gradient & Directions', order: 11, x: 18, y: 10 },
		{ key: 13, domainKey: 4, name: 'Multiple Integrals', order: 12, x: 5, y: 26 },

		// Domain 5: Vector Spaces & Geometry
		{ key: 14, domainKey: 5, name: 'Vector Subspaces & Span', order: 13, x: 44, y: -30 },
		{ key: 15, domainKey: 5, name: 'Linear Independence & Basis', order: 14, x: 70, y: -30 },
		{ key: 16, domainKey: 5, name: 'Linear Transformations', order: 15, x: 44, y: -12 },
		{ key: 17, domainKey: 5, name: 'Orthogonality & Projections', order: 16, x: 70, y: -12 },

		// Domain 7: Vector Calculus
		{ key: 18, domainKey: 7, name: 'Vector Fields & Divergence', order: 17, x: 36, y: 18 },
		{ key: 19, domainKey: 7, name: 'Line & Surface Integrals', order: 18, x: 62, y: 18 },

		// Domain 6: Differential Equations
		{ key: 20, domainKey: 6, name: 'Eigenvalues & Eigenvectors', order: 19, x: 94, y: -16 },
		{ key: 21, domainKey: 6, name: 'First-Order ODEs', order: 20, x: 94, y: 2 },
		{ key: 22, domainKey: 6, name: 'Systems of Linear ODEs', order: 21, x: 94, y: 20 }
	];

	const subjectMap = new Map<number, Subject>();
	for (const s of subjectData) {
		const domain = domainMap.get(s.domainKey)!;
		const created = await prisma.subject.create({
			data: {
				name: s.name,
				order: s.order,
				x: s.x,
				y: s.y,
				graphId: graph.id,
				domainId: domain.id
			}
		});
		subjectMap.set(s.key, created);
	}

	// Seed Subject Relations (Edges)
	const subjectEdges = [
		{ source: 1, target: 2 },
		{ source: 2, target: 3 },
		{ source: 3, target: 4 },
		{ source: 3, target: 7 },
		{ source: 4, target: 5 },
		{ source: 4, target: 6 },
		{ source: 5, target: 16 },
		{ source: 6, target: 20 },
		{ source: 7, target: 14 },
		{ source: 8, target: 9 },
		{ source: 9, target: 10 },
		{ source: 9, target: 11 },
		{ source: 10, target: 13 },
		{ source: 10, target: 21 },
		{ source: 11, target: 12 },
		{ source: 12, target: 18 },
		{ source: 13, target: 19 },
		{ source: 14, target: 15 },
		{ source: 15, target: 17 },
		{ source: 15, target: 20 },
		{ source: 16, target: 20 },
		{ source: 17, target: 20 },
		{ source: 18, target: 19 },
		{ source: 20, target: 22 },
		{ source: 21, target: 22 }
	];

	for (const edge of subjectEdges) {
		const sourceSubject = subjectMap.get(edge.source)!;
		const targetSubject = subjectMap.get(edge.target)!;
		await prisma.subject.update({
			where: { id: sourceSubject.id },
			data: {
				targetSubjects: {
					connect: { id: targetSubject.id }
				}
			}
		});
	}

	// Seed Lectures
	const lectureData = [
		{
			name: 'Week 1: Linear Systems & Foundations',
			order: 0,
			subjectKeys: [1, 2, 8]
		},
		{
			name: 'Week 2: Matrices & Differentiation',
			order: 1,
			subjectKeys: [3, 4, 9]
		},
		{
			name: 'Week 3: Inverses, Determinants & Integrals',
			order: 2,
			subjectKeys: [5, 6, 7, 10]
		},
		{
			name: 'Week 4: Multivariable Calculus & Subspaces',
			order: 3,
			subjectKeys: [11, 12, 14, 15]
		},
		{
			name: 'Week 5: Vector Calculus & Transformations',
			order: 4,
			subjectKeys: [13, 16, 17, 18]
		},
		{
			name: 'Week 6: Eigenvalues & Systems of ODEs',
			order: 5,
			subjectKeys: [19, 20, 21, 22]
		}
	];

	for (const l of lectureData) {
		const lectureSubjects = l.subjectKeys.map((key) => subjectMap.get(key)!);
		await prisma.lecture.create({
			data: {
				name: l.name,
				order: l.order,
				subjectOrder: lectureSubjects.map((s) => s.id),
				graphId: graph.id,
				subjects: {
					connect: lectureSubjects.map((s) => ({ id: s.id }))
				}
			}
		});
	}

	console.log('Seeding finished.');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
