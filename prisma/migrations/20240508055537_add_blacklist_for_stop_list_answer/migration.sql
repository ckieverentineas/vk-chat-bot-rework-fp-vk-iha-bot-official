-- CreateTable
CREATE TABLE "BlackList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BlackList_text_key" ON "BlackList"("text");
