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
          startTime: (a.startTime as Date).toISOString(),
          durationMinutes: services.find(s => s.id === a.serviceId)?.duration || 30,
        })),
      barberSchedules: barbers.map(b => ({
        barberId: b.id,
        availability: b.availability.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
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
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const batch = writeBatch(db);

    // 1. Seed Services
    services.forEach(service => {
      const serviceRef = doc(db, "services", service.id);
      batch.set(serviceRef, service);
    });

    // 2. Seed Barbers and their Schedules (subcollection)
    barbers.forEach(barber => {
      const { availability, ...barberData } = barber;
      const barberRef = doc(db, "barbers", barber.id);
      batch.set(barberRef, barberData);

      availability.forEach((slot, index) => {
        const scheduleId = `schedule_${barber.id}_${index}`;
        const scheduleRef = doc(db, "barbers", barber.id, "schedules", scheduleId);
        const dayOfWeek = new Date(slot.startTime).toLocaleString('en-US', { weekday: 'long' });
        batch.set(scheduleRef, { 
          ...slot,
          barberId: barber.id,
          id: scheduleId,
          dayOfWeek: dayOfWeek,
        });
      });
    });

    // 3. Seed Customers and their Appointments (subcollection)
    const customerIds = new Set(appointments.map(a => a.customerId));
    
    customerIds.forEach(id => {
      const appointmentForCustomer = appointments.find(a => a.customerId === id);
      const customerRef = doc(db, "customers", id);
      batch.set(customerRef, {
        id: id,
        name: appointmentForCustomer?.customerName || 'Unknown Customer',
        email: `${(appointmentForCustomer?.customerName || id).split(' ').join('.').toLowerCase()}@example.com`,
        phone: '123-456-7890'
      }, { merge: true });
    });

    appointments.forEach(appointment => {
      const appointmentRef = doc(db, "customers", appointment.customerId, "appointments", appointment.id);
      batch.set(appointmentRef, appointment);
    });

    await batch.commit();
    
    const total = services.length + barbers.length + appointments.length + customerIds.size + barbers.reduce((acc, b) => acc + b.availability.length, 0);
    return { success: true, message: `Successfully seeded ${total} total documents.` };
  } catch (error) {
    console.error("Error seeding data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to seed data: ${errorMessage}` };
  }
}
