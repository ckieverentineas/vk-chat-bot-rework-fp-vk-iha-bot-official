/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Dictionary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dictionary_name_key" ON "Dictionary"("name");
