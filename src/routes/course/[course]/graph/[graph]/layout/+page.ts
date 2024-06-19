
import { Course, Graph } from '$scripts/entities'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	return {
		course: Course.revive({}),
		graph: Graph.revive({"id":1,"name":"New Graph","domains":[{"id":1,"x":0,"y":0,"style":"prosperous-red","name":"Domain 1","parents":[],"children":[2,3]},{"id":2,"x":0,"y":0,"style":"energizing-orange","name":"Domain 2","parents":[1],"children":[3]},{"id":3,"x":0,"y":0,"style":"sunny-yellow","name":"Domain 3","parents":[1,2],"children":[]}],"subjects":[{"id":1,"x":0,"y":0,"domain":1,"name":"Subject 1","parents":[],"children":[2,3]},{"id":2,"x":0,"y":0,"domain":1,"name":"Subject 2","parents":[1],"children":[3]},{"id":3,"x":0,"y":0,"domain":2,"name":"Subject 3","parents":[1,2],"children":[4,5]},{"id":4,"x":0,"y":0,"domain":3,"name":"Subject 4","parents":[3],"children":[]},{"id":5,"x":0,"y":0,"domain":3,"name":"Subject 5","parents":[3],"children":[]}],"lectures":[{"id":1,"name":"Lecture 1","subjects":[2,3]}]})
	}
}