"use server";

import { optimizeQueue, type OptimizeQueueInput } from "@/ai/flows/intelligent-queue-management";
import { appointments, barbers, services } from "@/lib/data";
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

    // Seed services
    services.forEach(service => {
      const docRef = doc(db, "services", service.id);
      batch.set(docRef, service);
    });

    // Seed barbers and their schedules
    barbers.forEach(barber => {
      // Omit availability from the main barber doc before writing
      const { availability, ...barberData } = barber;
      const barberDocRef = doc(db, "barbers", barber.id);
      batch.set(barberDocRef, barberData);

      // Seed schedules as a subcollection
      availability.forEach((slot, index) => {
        // Create a stable ID for the schedule
        const scheduleId = `schedule_${barber.id}_${index}`;
        const scheduleDocRef = doc(db, "barbers", barber.id, "schedules", scheduleId);
        
        // Determine day of the week from the start time
        const dayOfWeek = new Date(slot.startTime).toLocaleString('en-US', { weekday: 'long' });

        batch.set(scheduleDocRef, { 
          ...slot,
          barberId: barber.id,
          dayOfWeek: dayOfWeek,
        });
      });
    });

    // Seed customers and their appointments
    appointments.forEach(appointment => {
      // Ensure the customer document exists (or create it)
      const customerRef = doc(db, "customers", appointment.customerId);
      // Let's create a more complete customer for seeding
      batch.set(customerRef, { 
        id: appointment.customerId, 
        name: appointment.customerName,
        email: `${appointment.customerName.split(' ').join('.').toLowerCase()}@example.com`,
        phone: '123-456-7890'
      }, { merge: true });

      // Create the appointment in the subcollection
      const docRef = doc(db, "customers", appointment.customerId, "appointments", appointment.id);
      batch.set(docRef, appointment);
    });

    await batch.commit();
    
    const total = services.length + barbers.length + appointments.length + barbers.reduce((acc, b) => acc + b.availability.length, 0);
    return { success: true, message: `Successfully seeded ${total} total documents.` };
  } catch (error) {
    console.error("Error seeding data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to seed data: ${errorMessage}` };
  }
}
