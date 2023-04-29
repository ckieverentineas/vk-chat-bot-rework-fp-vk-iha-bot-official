/*
  Warnings:

  - You are about to drop the column `last` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastlast` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "say_me" TEXT NOT NULL DEFAULT '',
    "say" TEXT NOT NULL DEFAULT '',
    "memorytrg" BOOLEAN NOT NULL DEFAULT false,
    "ignore" BOOLEAN NOT NULL DEFAULT false,
    "warning" INTEGER NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("count", "crdate", "id", "idvk", "ignore", "memorytrg", "say", "update", "warning") SELECT "count", "crdate", "id", "idvk", "ignore", "memorytrg", "say", "update", "warning" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_idvk_key" ON "User"("idvk");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
