/*
  Warnings:

  - You are about to drop the column `qestion` on the `Answer` table. All the data in the column will be lost.
  - Made the column `id_question` on table `Answer` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answer" TEXT NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_question" INTEGER NOT NULL,
    CONSTRAINT "Answer_id_question_fkey" FOREIGN KEY ("id_question") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Answer" ("answer", "crdate", "id", "id_question") SELECT "answer", "crdate", "id", "id_question" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
