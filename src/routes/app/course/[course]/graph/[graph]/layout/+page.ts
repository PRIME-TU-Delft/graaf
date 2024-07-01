
import { Course, Graph } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.revive({code: 'CSE1200', name: 'Calculus', users: [{name: 'Bram Kreulen', permissions: 'admin'}]}),
		graph: Graph.revive({
			id: 1,
			name: 'Calculus Graph',
			domains: [
				{
					id: 1,
					x: 0,
					y: 0,
					style: 'prosperous-red',
					name: 'Domain A',
					parents: [],
					children: [2, 3]
				},
				{
					id: 2,
					x: 0,
					y: 0,
					style: 'electric-green',
					name: 'Domain B',
					parents: [1],
					children: [3]
				},
				{
					id: 3,
					x: 0,
					y: 0,
					style: 'mysterious-blue',
					name: 'Domain C',
					parents: [1, 2],
					children: []
				}
			],
			subjects: [
				{
					id: 1,
					x: 0,
					y: 0,
					domain: 1,
					name: 'Subject 1',
					parents: [],
					children: [2, 3, 5]
				},
				{
					id: 2,
					x: 0,
					y: 0,
					domain: 1,
					name: 'Subject 2',
					parents: [1],
					children: []
				},
				{
					id: 3,
					x: 0,
					y: 0,
					domain: 2,
					name: 'Subject 3',
					parents: [1],
					children: [4, 5]
				},
				{
					id: 4,
					x: 0,
					y: 0,
					domain: 2,
					name: 'Subject 4',
					parents: [3],
					children: []
				},
				{
					id: 5,
					x: 0,
					y: 0,
					domain: 3,
					name: 'Subject 5',
					parents: [3, 1],
					children: [6]
				},
				{
					id: 6,
					x: 0,
					y: 0,
					domain: 3,
					name: 'Subject 6',
					parents: [5],
					children: []
				}
			],
			lectures: [
				{
					id: 1,
					name: 'Lecture 1',
					subjects: [1, 2]
				},
				{
					id: 2,
					name: 'Lecture 2',
					subjects: [3, 4]
				},
				{
					id: 3,
					name: 'Lecture 3',
					subjects: [5, 6]
				}
			]
		})
	}
}