/*
  Warnings:

  - A unique constraint covering the columns `[qestion,answer]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Answer_qestion_answer_key" ON "Answer"("qestion", "answer");
