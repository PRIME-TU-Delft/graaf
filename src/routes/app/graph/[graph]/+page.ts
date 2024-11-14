
import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	redirect(302, `/app/graph/${params.graph}/settings`) // TODO Change to /app/graph/${params.graph}/overview
}
