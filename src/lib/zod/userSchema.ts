import { z } from 'zod';

export const changeUserRoleSchema = z.object({
	userId: z.string().min(1),
	role: z.enum(['ADMIN', 'USER'])
});
