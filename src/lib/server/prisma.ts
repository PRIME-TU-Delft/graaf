import { PrismaClient } from '@prisma/client';

import GraphExtension from '$lib/server/GraphExtension';
import LectureExtension from '$lib/server/LectureExtension';


const prisma = new PrismaClient()
	.$extends(GraphExtension)
	.$extends(LectureExtension);

export default prisma;
