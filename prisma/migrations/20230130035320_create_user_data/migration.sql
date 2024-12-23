-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "last" TEXT NOT NULL DEFAULT '',
    "lastlast" TEXT NOT NULL DEFAULT '',
    "ignore" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_idvk_key" ON "User"("idvk");
