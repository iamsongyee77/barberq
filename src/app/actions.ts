"use server";

import { optimizeQueue, type OptimizeQueueInput } from "@/ai/flows/intelligent-queue-management";
import { appointments, barbers, services, customers } from "@/lib/data";
import { getFirestore, writeBatch, doc } from "firebase/firestore";
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from "@/firebase/config";

export async function runQueueOptimizer() {
  try {
    const input: OptimizeQueueInput = {
      appointments: appointments
        .filter(a => a.status === 'Confirmed')
        .map(a => ({
          appointmentId: a.id,
          customerId: a.customerId,
          barberId: a.barberId,
          serviceId: a.serviceId,
          startTime: a.startTime.toISOString(),
          durationMinutes: services.find(s => s.id === a.serviceId)?.duration || 30,
        })),
      barberSchedules: barbers.map(b => ({
        barberId: b.id,
        availability: b.availability,
      })),
      serviceDurations: services.map(s => ({
        serviceId: s.id,
        durationMinutes: s.duration,
      })),
      // Customer preferences are now optional, sending an empty array
      customerPreferences: [],
    };

    const result = await optimizeQueue(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error running queue optimizer:", error);
    return { success: false, error: "Failed to run the queue optimizer." };
  }
}

export async function seedData() {
  try {
    // Use the regular client SDK for server actions in this environment
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const batch = writeBatch(db);

    // Seed barbers
    barbers.forEach(barber => {
      const docRef = doc(db, "barbers", barber.id);
      batch.set(docRef, barber);
    });

    await batch.commit();

    return { success: true, message: `${barbers.length} barbers have been seeded.` };
  } catch (error) {
    console.error("Error seeding data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to seed data: ${errorMessage}` };
  }
}
