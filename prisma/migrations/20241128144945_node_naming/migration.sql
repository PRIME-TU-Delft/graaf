-- AlterTable
ALTER TABLE "Graph" ADD COLUMN     "domainName" TEXT NOT NULL DEFAULT 'Domain',
ADD COLUMN     "lectureName" TEXT NOT NULL DEFAULT 'Lecture',
ADD COLUMN     "subjectName" TEXT NOT NULL DEFAULT 'Subject';
