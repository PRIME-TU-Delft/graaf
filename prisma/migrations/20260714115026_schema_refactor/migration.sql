/*
  Warnings:

  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type` on the `Course` table. All the data in the column will be lost.
  - The `courseId` column on the `Graph` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Program` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Program` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `_PinnedCourse` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ProgramCourse` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_AdminProgramRelation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AdminRelation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EditorProgramRelation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EditorRelation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LectureToSubject` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseId,sandboxId,name]` on the table `Graph` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Domain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentType` to the `Graph` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lecture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `A` on the `_PinnedCourse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `A` on the `_ProgramCourse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_ProgramCourse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('COURSE', 'SANDBOX');

-- DropForeignKey
ALTER TABLE "Graph" DROP CONSTRAINT "Graph_courseId_fkey";

-- DropForeignKey
ALTER TABLE "_AdminProgramRelation" DROP CONSTRAINT "_AdminProgramRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_AdminProgramRelation" DROP CONSTRAINT "_AdminProgramRelation_B_fkey";

-- DropForeignKey
ALTER TABLE "_AdminRelation" DROP CONSTRAINT "_AdminRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_AdminRelation" DROP CONSTRAINT "_AdminRelation_B_fkey";

-- DropForeignKey
ALTER TABLE "_EditorProgramRelation" DROP CONSTRAINT "_EditorProgramRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_EditorProgramRelation" DROP CONSTRAINT "_EditorProgramRelation_B_fkey";

-- DropForeignKey
ALTER TABLE "_EditorRelation" DROP CONSTRAINT "_EditorRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_EditorRelation" DROP CONSTRAINT "_EditorRelation_B_fkey";

-- DropForeignKey
ALTER TABLE "_LectureToSubject" DROP CONSTRAINT "_LectureToSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "_LectureToSubject" DROP CONSTRAINT "_LectureToSubject_B_fkey";

-- DropForeignKey
ALTER TABLE "_PinnedCourse" DROP CONSTRAINT "_PinnedCourse_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramCourse" DROP CONSTRAINT "_ProgramCourse_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramCourse" DROP CONSTRAINT "_ProgramCourse_B_fkey";

-- DropIndex
DROP INDEX "Domain_name_graphId_key";

-- DropIndex
DROP INDEX "Graph_courseId_name_key";

-- DropIndex
DROP INDEX "Lecture_name_graphId_key";

-- DropIndex
DROP INDEX "Subject_name_domainId_key";

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "type",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Graph" ADD COLUMN     "parentType" "ParentType" NOT NULL,
ADD COLUMN     "sandboxId" INTEGER,
DROP COLUMN "courseId",
ADD COLUMN     "courseId" INTEGER;

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Program" DROP CONSTRAINT "Program_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Program_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "_PinnedCourse" DROP CONSTRAINT "_PinnedCourse_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ADD CONSTRAINT "_PinnedCourse_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_ProgramCourse" DROP CONSTRAINT "_ProgramCourse_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL,
ADD CONSTRAINT "_ProgramCourse_AB_pkey" PRIMARY KEY ("A", "B");

-- DropTable
DROP TABLE "_AdminProgramRelation";

-- DropTable
DROP TABLE "_AdminRelation";

-- DropTable
DROP TABLE "_EditorProgramRelation";

-- DropTable
DROP TABLE "_EditorRelation";

-- DropTable
DROP TABLE "_LectureToSubject";

-- DropEnum
DROP TYPE "CourseType";

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "parentType" "ParentType" NOT NULL,
    "courseId" INTEGER,
    "sandboxId" INTEGER,
    "graphId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramEditor" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramEditor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProgramAdmin" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramAdmin_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CourseEditor" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseEditor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CourseAdmin" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseAdmin_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SandboxEditor" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SandboxEditor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LectureSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LectureSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_courseId_name_key" ON "Link"("courseId", "name");

-- CreateIndex
CREATE INDEX "_ProgramEditor_B_index" ON "_ProgramEditor"("B");

-- CreateIndex
CREATE INDEX "_ProgramAdmin_B_index" ON "_ProgramAdmin"("B");

-- CreateIndex
CREATE INDEX "_CourseEditor_B_index" ON "_CourseEditor"("B");

-- CreateIndex
CREATE INDEX "_CourseAdmin_B_index" ON "_CourseAdmin"("B");

-- CreateIndex
CREATE INDEX "_SandboxEditor_B_index" ON "_SandboxEditor"("B");

-- CreateIndex
CREATE INDEX "_LectureSubject_B_index" ON "_LectureSubject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Graph_courseId_sandboxId_name_key" ON "Graph"("courseId", "sandboxId", "name");

-- CreateIndex
CREATE INDEX "_ProgramCourse_B_index" ON "_ProgramCourse"("B");

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Graph" ADD CONSTRAINT "Graph_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Graph" ADD CONSTRAINT "Graph_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramEditor" ADD CONSTRAINT "_ProgramEditor_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramEditor" ADD CONSTRAINT "_ProgramEditor_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramAdmin" ADD CONSTRAINT "_ProgramAdmin_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramAdmin" ADD CONSTRAINT "_ProgramAdmin_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramCourse" ADD CONSTRAINT "_ProgramCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramCourse" ADD CONSTRAINT "_ProgramCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseEditor" ADD CONSTRAINT "_CourseEditor_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseEditor" ADD CONSTRAINT "_CourseEditor_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseAdmin" ADD CONSTRAINT "_CourseAdmin_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseAdmin" ADD CONSTRAINT "_CourseAdmin_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PinnedCourse" ADD CONSTRAINT "_PinnedCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SandboxEditor" ADD CONSTRAINT "_SandboxEditor_A_fkey" FOREIGN KEY ("A") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SandboxEditor" ADD CONSTRAINT "_SandboxEditor_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureSubject" ADD CONSTRAINT "_LectureSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureSubject" ADD CONSTRAINT "_LectureSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
