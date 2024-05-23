/*
  Warnings:

  - Made the column `style` on table `Domain` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `graphId` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Made the column `style` on table `Subject` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Domain" ALTER COLUMN "style" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "graphId" INTEGER NOT NULL,
ALTER COLUMN "style" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "Graph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
