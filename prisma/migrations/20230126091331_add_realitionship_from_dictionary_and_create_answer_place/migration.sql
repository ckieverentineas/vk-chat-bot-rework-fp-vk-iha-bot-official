/*
  Warnings:

  - You are about to drop the `Word_Couple` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Word_Couple";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Couple" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_fisrt" INTEGER NOT NULL,
    "id_second" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Couple_id_fisrt_fkey" FOREIGN KEY ("id_fisrt") REFERENCES "Dictionary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Couple_id_second_fkey" FOREIGN KEY ("id_second") REFERENCES "Dictionary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qestion" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dictionary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "Score" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Dictionary" ("id", "name") SELECT "id", "name" FROM "Dictionary";
DROP TABLE "Dictionary";
ALTER TABLE "new_Dictionary" RENAME TO "Dictionary";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
