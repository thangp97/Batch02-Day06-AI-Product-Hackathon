-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
