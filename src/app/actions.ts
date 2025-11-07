"use server";

import { optimizeQueue, type OptimizeQueueInput } from "@/ai/flows/intelligent-queue-management";
import { appointments, barbers, services, customers } from "@/lib/data";
import { getFirestore, writeBatch, doc } from "firebase/admin/firestore";
import { getApp, getApps, initializeApp } from 'firebase-admin/app';

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
    const adminApp = !getApps().length ? initializeApp() : getApp();
    const db = getFirestore(adminApp);
    const batch = writeBatch(db);

    // Seed services
    services.forEach(service => {
      const docRef = doc(db, "services", service.id);
      batch.set(docRef, service);
    });

    // Seed barbers
    barbers.forEach(barber => {
      const docRef = doc(db, "barbers", barber.id);
      batch.set(docRef, barber);
    });

    // Seed appointments (as subcollections of customers)
    // First, ensure customer docs exist.
    const uniqueCustomerIds = [...new Set(appointments.map(a => a.customerId))];
    uniqueCustomerIds.forEach(id => {
      const customerDocRef = doc(db, "customers", id);
      const customerData = customers.find(c => c.id === id) || {
        id,
        name: appointments.find(a => a.customerId === id)?.customerName || `Customer ${id}`,
        email: `customer${id}@example.com`,
        phone: '123-456-7890',
        preferences: {}
      }
      batch.set(customerDocRef, customerData, { merge: true });
    });

    appointments.forEach(appointment => {
      const docRef = doc(db, "customers", appointment.customerId, "appointments", appointment.id);
      // Firestore Admin SDK expects Timestamps, not JS Dates
      const firestoreAppointment = {
        ...appointment,
        startTime: new Date(appointment.startTime),
        endTime: new Date(appointment.endTime),
      };
      batch.set(docRef, firestoreAppointment);
    });

    await batch.commit();

    return { success: true, message: `${services.length} services, ${barbers.length} barbers, and ${appointments.length} appointments seeded.` };
  } catch (error) {
    console.error("Error seeding data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to seed data: ${errorMessage}` };
  }
}
