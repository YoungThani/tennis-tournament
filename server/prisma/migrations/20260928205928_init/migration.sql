-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "ranking" INTEGER,
    "age" INTEGER,
    "plays" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "round" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "bestOf" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "player1Points" INTEGER NOT NULL DEFAULT 0,
    "player2Points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "setNumber" INTEGER NOT NULL,
    "player1Games" INTEGER NOT NULL DEFAULT 0,
    "player2Games" INTEGER NOT NULL DEFAULT 0,
    "matchId" INTEGER NOT NULL,
    CONSTRAINT "SetScore_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CoachToPlayer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CoachToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "Coach" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CoachToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SetScore_matchId_setNumber_key" ON "SetScore"("matchId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_CoachToPlayer_AB_unique" ON "_CoachToPlayer"("A", "B");

-- CreateIndex
CREATE INDEX "_CoachToPlayer_B_index" ON "_CoachToPlayer"("B");
