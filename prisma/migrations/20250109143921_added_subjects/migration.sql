/*
  Warnings:

  - A unique constraint covering the columns `[name,graphId]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "graphId" INTEGER NOT NULL,
    "domainId" INTEGER,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecture" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "graphId" INTEGER NOT NULL,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SubjectRelation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SubjectRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LectureToSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LectureToSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_domainId_key" ON "Subject"("name", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecture_name_graphId_key" ON "Lecture"("name", "graphId");

-- CreateIndex
CREATE INDEX "_SubjectRelation_B_index" ON "_SubjectRelation"("B");

-- CreateIndex
CREATE INDEX "_LectureToSubject_B_index" ON "_LectureToSubject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_graphId_key" ON "Domain"("name", "graphId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectRelation" ADD CONSTRAINT "_SubjectRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectRelation" ADD CONSTRAINT "_SubjectRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LectureToSubject" ADD CONSTRAINT "_LectureToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
