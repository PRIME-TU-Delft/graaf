/*
  Warnings:

  - You are about to drop the column `description` on the `Course` table. All the data in the column will be lost.
  - The `style` column on the `Domain` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `description` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the `CourseUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GraphLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgramUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectLecture` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `Domain` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Lecture` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Subject` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DomainStyle" AS ENUM ('PROSPEROUS_RED', 'ENERGIZING_ORANGE', 'SUNNY_YELLOW', 'ELECTRIC_GREEN', 'CONFIDENT_TURQUOISE', 'MYSTERIOUS_BLUE', 'MAJESTIC_PURPLE', 'POWERFUL_PINK', 'NEUTRAL_GRAY', 'SERIOUS_BROWN');

-- DropForeignKey
ALTER TABLE "CourseUser" DROP CONSTRAINT "CourseUser_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseUser" DROP CONSTRAINT "CourseUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_graphId_fkey";

-- DropForeignKey
ALTER TABLE "GraphLink" DROP CONSTRAINT "GraphLink_courseId_fkey";

-- DropForeignKey
ALTER TABLE "GraphLink" DROP CONSTRAINT "GraphLink_graphId_fkey";

-- DropForeignKey
ALTER TABLE "Lecture" DROP CONSTRAINT "Lecture_graphId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramUser" DROP CONSTRAINT "ProgramUser_programId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramUser" DROP CONSTRAINT "ProgramUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_graphId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectLecture" DROP CONSTRAINT "SubjectLecture_lectureId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectLecture" DROP CONSTRAINT "SubjectLecture_subjectId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT -1,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT '',
DROP COLUMN "style",
ADD COLUMN     "style" "DomainStyle";

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT -1,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "style",
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT -1,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT '';

-- DropTable
DROP TABLE "CourseUser";

-- DropTable
DROP TABLE "GraphLink";

-- DropTable
DROP TABLE "ProgramUser";

-- DropTable
DROP TABLE "SubjectLecture";

-- DropEnum
DROP TYPE "CourseRole";

-- DropEnum
DROP TYPE "ProgramRole";

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "courseId" INTEGER NOT NULL,
    "graphId" INTEGER,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EditorRelation" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AdminRelation" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_LectureToSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EditorRelation_AB_unique" ON "_EditorRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_EditorRelation_B_index" ON "_EditorRelation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AdminRelation_AB_unique" ON "_AdminRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_AdminRelation_B_index" ON "_AdminRelation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LectureToSubject_AB_unique" ON "_LectureToSubject"("A", "B");

-- CreateIndex
CREATE INDEX "_LectureToSubject_B_index" ON "_LectureToSubject"("B");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EditorRelation" ADD CONSTRAINT "_EditorRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EditorRelation" ADD CONSTRAINT "_EditorRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminRelation" ADD CONSTRAINT "_AdminRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminRelation" ADD CONSTRAINT "_AdminRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
