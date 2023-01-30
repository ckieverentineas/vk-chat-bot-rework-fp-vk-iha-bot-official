-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "last" TEXT NOT NULL DEFAULT '',
    "lastlast" TEXT NOT NULL DEFAULT '',
    "ignore" BOOLEAN NOT NULL DEFAULT false,
    "counter" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("id", "idvk", "ignore", "last", "lastlast") SELECT "id", "idvk", "ignore", "last", "lastlast" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_idvk_key" ON "User"("idvk");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
