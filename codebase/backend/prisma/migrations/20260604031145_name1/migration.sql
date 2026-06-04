-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" SERIAL NOT NULL,
    "specialty_id" INTEGER NOT NULL,
    "doctor" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_logs" (
    "id" SERIAL NOT NULL,
    "symptoms" TEXT NOT NULL,
    "ai_level" TEXT NOT NULL,
    "ai_suggested" TEXT,
    "user_action" TEXT NOT NULL,
    "user_selected" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialties_code_key" ON "specialties"("code");

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
