/*
  Warnings:

  - A unique constraint covering the columns `[courseId,name]` on the table `Graph` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DomainStyle" AS ENUM ('PROSPEROUS_RED', 'ENERGIZING_ORANGE', 'SUNNY_YELLOW', 'ELECTRIC_GREEN', 'CONFIDENT_TURQUOISE', 'MYSTERIOUS_BLUE', 'MAJESTIC_PURPLE', 'POWERFUL_PINK', 'NEUTRAL_GRAY', 'SERIOUS_BROWN');

-- CreateTable
CREATE TABLE "Domain" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "style" "DomainStyle",
    "order" INTEGER NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "graphId" INTEGER NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DomainRelation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DomainRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DomainRelation_B_index" ON "_DomainRelation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Graph_courseId_name_key" ON "Graph"("courseId", "name");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainRelation" ADD CONSTRAINT "_DomainRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainRelation" ADD CONSTRAINT "_DomainRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
