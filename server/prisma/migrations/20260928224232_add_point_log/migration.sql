-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
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
    "pointLog" TEXT NOT NULL DEFAULT '',
    "player1Points" INTEGER NOT NULL DEFAULT 0,
    "player2Points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("bestOf", "court", "createdAt", "id", "player1Id", "player1Points", "player2Id", "player2Points", "round", "scheduledAt", "status", "winnerId") SELECT "bestOf", "court", "createdAt", "id", "player1Id", "player1Points", "player2Id", "player2Points", "round", "scheduledAt", "status", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
