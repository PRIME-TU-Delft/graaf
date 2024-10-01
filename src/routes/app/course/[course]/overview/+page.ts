
// Internal imports
import { CourseController } from '$scripts/controllers'

// Load
export async function load({ data }) {
    const course = await CourseController.revive(data.course)
    return { course }
}