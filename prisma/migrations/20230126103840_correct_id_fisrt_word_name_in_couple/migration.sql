/*
  Warnings:

  - You are about to drop the column `Score` on the `Dictionary` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dictionary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Dictionary" ("crdate", "id", "word") SELECT "crdate", "id", "word" FROM "Dictionary";
DROP TABLE "Dictionary";
ALTER TABLE "new_Dictionary" RENAME TO "Dictionary";
CREATE UNIQUE INDEX "Dictionary_word_key" ON "Dictionary"("word");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
