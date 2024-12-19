/*
  Warnings:

  - You are about to drop the column `unchanged` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the column `domainName` on the `Graph` table. All the data in the column will be lost.
  - You are about to drop the column `lectureName` on the `Graph` table. All the data in the column will be lost.
  - You are about to drop the column `subjectName` on the `Graph` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Graph` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Lecture` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Link` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `unchanged` on the `Subject` table. All the data in the column will be lost.
  - The primary key for the `_AdminRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_CourseToProgram` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_DomainRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_EditorRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_LectureToSubject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_SubjectRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_AdminRelation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_CourseToProgram` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_DomainRelation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_EditorRelation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_LectureToSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_SubjectRelation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "Graph" DROP COLUMN "domainName",
DROP COLUMN "lectureName",
DROP COLUMN "subjectName",
DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "Lecture" DROP COLUMN "unchanged",
ALTER COLUMN "order" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Link" DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "unchanged";

-- AlterTable
ALTER TABLE "_AdminRelation" DROP CONSTRAINT "_AdminRelation_AB_pkey";

-- AlterTable
ALTER TABLE "_CourseToProgram" DROP CONSTRAINT "_CourseToProgram_AB_pkey";

-- AlterTable
ALTER TABLE "_DomainRelation" DROP CONSTRAINT "_DomainRelation_AB_pkey";

-- AlterTable
ALTER TABLE "_EditorRelation" DROP CONSTRAINT "_EditorRelation_AB_pkey";

-- AlterTable
ALTER TABLE "_LectureToSubject" DROP CONSTRAINT "_LectureToSubject_AB_pkey";

-- AlterTable
ALTER TABLE "_SubjectRelation" DROP CONSTRAINT "_SubjectRelation_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_AdminRelation_AB_unique" ON "_AdminRelation"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseToProgram_AB_unique" ON "_CourseToProgram"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_DomainRelation_AB_unique" ON "_DomainRelation"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_EditorRelation_AB_unique" ON "_EditorRelation"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_LectureToSubject_AB_unique" ON "_LectureToSubject"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_SubjectRelation_AB_unique" ON "_SubjectRelation"("A", "B");
