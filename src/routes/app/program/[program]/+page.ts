
import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
	redirect(302, `/app/program/${params.program}/settings`)
}
