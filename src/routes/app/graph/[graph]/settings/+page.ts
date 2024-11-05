
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, course, graph, domains, subjects, lectures } from './stores'

import {
	ControllerCache,
	CourseController,
	GraphController,
	DomainController,
	SubjectController,
	LectureController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data }) => {
	const new_cache = new ControllerCache()
	course.set(CourseController.revive(new_cache, data.course))
	graph.set(GraphController.revive(new_cache, data.graph))
	domains.set(data.domains.map(domain => DomainController.revive(new_cache, domain)))
	subjects.set(data.subjects.map(subject => SubjectController.revive(new_cache, subject)))
	lectures.set(data.lectures.map(lecture => LectureController.revive(new_cache, lecture)))
	cache.set(new_cache)
}