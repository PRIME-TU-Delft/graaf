/*
  Warnings:

  - You are about to drop the column `programId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `_LectureToSubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProgramToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProgramRole" AS ENUM ('WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "CourseRole" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_programId_fkey";

-- DropForeignKey
ALTER TABLE "_LectureToSubject" DROP CONSTRAINT "_LectureToSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "_LectureToSubject" DROP CONSTRAINT "_LectureToSubject_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramToUser" DROP CONSTRAINT "_ProgramToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramToUser" DROP CONSTRAINT "_ProgramToUser_B_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "programId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "_LectureToSubject";

-- DropTable
DROP TABLE "_ProgramToUser";

-- CreateTable
CREATE TABLE "ProgramUser" (
    "userId" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "role" "ProgramRole" NOT NULL DEFAULT 'WRITE',

    CONSTRAINT "ProgramUser_pkey" PRIMARY KEY ("userId","programId")
);

-- CreateTable
CREATE TABLE "CourseUser" (
    "userId" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "role" "CourseRole" NOT NULL DEFAULT 'READ',

    CONSTRAINT "CourseUser_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateTable
CREATE TABLE "SubjectLecture" (
    "subjectId" INTEGER NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubjectLecture_pkey" PRIMARY KEY ("subjectId","lectureId")
);

-- CreateTable
CREATE TABLE "GraphLink" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "graphId" INTEGER,

    CONSTRAINT "GraphLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToProgram" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CourseToProgram_AB_unique" ON "_CourseToProgram"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseToProgram_B_index" ON "_CourseToProgram"("B");

-- AddForeignKey
ALTER TABLE "ProgramUser" ADD CONSTRAINT "ProgramUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramUser" ADD CONSTRAINT "ProgramUser_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUser" ADD CONSTRAINT "CourseUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUser" ADD CONSTRAINT "CourseUser_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectLecture" ADD CONSTRAINT "SubjectLecture_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectLecture" ADD CONSTRAINT "SubjectLecture_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphLink" ADD CONSTRAINT "GraphLink_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphLink" ADD CONSTRAINT "GraphLink_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToProgram" ADD CONSTRAINT "_CourseToProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToProgram" ADD CONSTRAINT "_CourseToProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
