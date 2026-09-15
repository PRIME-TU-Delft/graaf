-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LinkViewWeek" (
    "weekStart" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "linkId" INTEGER NOT NULL,

    CONSTRAINT "LinkViewWeek_pkey" PRIMARY KEY ("linkId","weekStart")
);

-- AddForeignKey
ALTER TABLE "LinkViewWeek" ADD CONSTRAINT "LinkViewWeek_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
