-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "baseRateCents" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isParent" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lockedAt" DATETIME,
    CONSTRAINT "Week_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyTargetDays" INTEGER NOT NULL,
    "targetBonusStars" INTEGER NOT NULL DEFAULT 2,
    "validFromWeekId" TEXT NOT NULL,
    "validToWeekId" TEXT,
    "replacesHabitId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Habit_validFromWeekId_fkey" FOREIGN KEY ("validFromWeekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Habit_validToWeekId_fkey" FOREIGN KEY ("validToWeekId") REFERENCES "Week" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Habit_replacesHabitId_fkey" FOREIGN KEY ("replacesHabitId") REFERENCES "Habit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HabitCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "HabitCheck_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HabitCheck_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HabitCheck_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chore_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "fromPlayerId" TEXT NOT NULL,
    "toPlayerId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Nomination_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nomination_fromPlayerId_fkey" FOREIGN KEY ("fromPlayerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nomination_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deduction_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deduction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreakShieldUse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StreakShieldUse_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StreakShieldUse_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeekResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "habitStars" INTEGER NOT NULL,
    "habitTargetBonusStars" INTEGER NOT NULL,
    "choreStars" INTEGER NOT NULL,
    "nominationStars" INTEGER NOT NULL,
    "deductionStars" INTEGER NOT NULL,
    "streakBonusStars" INTEGER NOT NULL,
    "weekComplete" BOOLEAN NOT NULL,
    "shieldUsed" BOOLEAN NOT NULL,
    "streakLengthAfter" INTEGER NOT NULL,
    "totalStars" INTEGER NOT NULL,
    CONSTRAINT "WeekResult_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WeekResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Week_seasonId_weekNumber_key" ON "Week"("seasonId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HabitCheck_habitId_date_key" ON "HabitCheck"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StreakShieldUse_weekId_playerId_key" ON "StreakShieldUse"("weekId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "WeekResult_weekId_playerId_key" ON "WeekResult"("weekId", "playerId");
