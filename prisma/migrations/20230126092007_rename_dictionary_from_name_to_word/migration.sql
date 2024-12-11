/*
  Warnings:

  - You are about to drop the column `name` on the `Dictionary` table. All the data in the column will be lost.
  - Added the required column `word` to the `Dictionary` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dictionary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "Score" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Dictionary" ("Score", "id") SELECT "Score", "id" FROM "Dictionary";
DROP TABLE "Dictionary";
ALTER TABLE "new_Dictionary" RENAME TO "Dictionary";
CREATE UNIQUE INDEX "Dictionary_word_key" ON "Dictionary"("word");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
