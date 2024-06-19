import { PrismaClient } from '@prisma/client';

import GraphExtension from '$lib/server/GraphExtension';
import LectureExtension from '$lib/server/LectureExtension';
import DomainExtension from '$lib/server/DomainExtension';
// import SubjectExtension from '$lib/server/SubjectExtension';


const prisma = new PrismaClient()
	.$extends(GraphExtension)
	.$extends(LectureExtension)
	.$extends(DomainExtension);
	// .$extends(SubjectExtension);

export default prisma;
