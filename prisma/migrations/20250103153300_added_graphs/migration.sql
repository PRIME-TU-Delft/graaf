/*
  Warnings:

  - You are about to drop the column `isArchived` on the `Program` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "isArchived";

-- CreateTable
CREATE TABLE "Graph" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Graph_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Graph" ADD CONSTRAINT "Graph_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
