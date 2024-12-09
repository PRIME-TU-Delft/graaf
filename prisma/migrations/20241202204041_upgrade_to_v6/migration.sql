-- AlterTable
ALTER TABLE "_AdminRelation" ADD CONSTRAINT "_AdminRelation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AdminRelation_AB_unique";

-- AlterTable
ALTER TABLE "_CourseToProgram" ADD CONSTRAINT "_CourseToProgram_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CourseToProgram_AB_unique";

-- AlterTable
ALTER TABLE "_DomainRelation" ADD CONSTRAINT "_DomainRelation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_DomainRelation_AB_unique";

-- AlterTable
ALTER TABLE "_EditorRelation" ADD CONSTRAINT "_EditorRelation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EditorRelation_AB_unique";

-- AlterTable
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_LectureToSubject_AB_unique";

-- AlterTable
ALTER TABLE "_SubjectRelation" ADD CONSTRAINT "_SubjectRelation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SubjectRelation_AB_unique";
