/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_domainId_fkey";

-- AlterTable
ALTER TABLE "Domain" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "style" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "style" DROP NOT NULL,
ALTER COLUMN "domainId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Lecture" (
    "id" SERIAL NOT NULL,
    "graphId" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LectureToSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_LectureToSubject_AB_unique" ON "_LectureToSubject"("A", "B");

-- CreateIndex
CREATE INDEX "_LectureToSubject_B_index" ON "_LectureToSubject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
