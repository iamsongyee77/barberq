"use server";

import { optimizeQueue, type OptimizeQueueInput } from "@/ai/flows/intelligent-queue-management";
import { appointments, barbers, services } from "@/lib/data";
import { getFirestore, writeBatch, doc } from "firebase/firestore";
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from "@/firebase/config";

export async function runQueueOptimizer() {
  try {
    // This is a placeholder for fetching real-time data from Firestore
    // For now, it uses mock data.
    const barberSchedulesFromData = barbers.map(b => ({
      barberId: b.id,
      availability: b.schedules?.map(slot => ({
        // This assumes start/end times are available in a compatible format
        // In a real scenario, you'd fetch and format this from Firestore's 'schedules' sub-collection
        startTime: new Date().toISOString(), // Placeholder
        endTime: new Date().toISOString(), // Placeholder
      })) || []
    }));


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
      barberSchedules: barberSchedulesFromData,
      serviceDurations: services.map(s => ({
        serviceId: s.id,
        durationMinutes: s.duration,
      })),
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

    // 1. Seed Shop Settings
    const shopSettingsRef = doc(db, "shopSettings", "hours");
    batch.set(shopSettingsRef, { 
      id: "hours",
      startTime: "09:00",
      endTime: "18:00"
    });
    
    // Seed Home Page Content
    const homeContentRef = doc(db, "pageContent", "home");
    batch.set(homeContentRef, {
        id: "home",
        shopName: "SnipQueue",
        heroHeadline: "Style, Simplified.",
        heroSubheadline: "Experience seamless appointment booking with SnipQueue. Your next great haircut is just a few clicks away.",
        feature1Title: "Expert Barbers",
        feature1Description: "Choose from our team of professional and experienced barbers.",
        feature2Title: "Easy Booking",
        feature2Description: "Book your appointment anytime, anywhere in just a few steps.",
        feature3Title: "AI-Powered Queue",
        feature3Description: "Our smart system optimizes schedules to minimize your wait time.",
        servicesTitle: "Our Services",
        barbersTitle: "Meet Our Barbers",
    });

    // 2. Seed Services
    services.forEach(service => {
      const serviceRef = doc(db, "services", service.id);
      batch.set(serviceRef, service);
    });

    // 3. Seed Barbers
    barbers.forEach(barber => {
      const { schedules, ...barberData } = barber;
      const barberRef = doc(db, "barbers", barber.id);
      batch.set(barberRef, barberData);

      // Seed schedules into the top-level 'schedules' collection
      schedules?.forEach((slot) => {
        if (slot.startTime && slot.endTime) { // Only seed if there's a schedule
            const scheduleId = `schedule_${barber.id}_${slot.dayOfWeek.toLowerCase()}`;
            const scheduleRef = doc(db, "schedules", scheduleId);
            batch.set(scheduleRef, { 
              ...slot,
              barberId: barber.id,
              id: scheduleId
            });
        }
      });
    });

    // 4. Seed Customers
    const customerIds = [...new Set(appointments.map(a => a.customerId))];
    
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

    // 5. Seed Appointments into top-level collection
    appointments.forEach(appointment => {
      const appointmentRef = doc(db, "appointments", appointment.id);
      batch.set(appointmentRef, appointment);
    });

    await batch.commit();
    
    const total = 2 + services.length + barbers.length + appointments.length + customerIds.length + barbers.reduce((acc, b) => acc + (b.schedules?.length || 0), 0);
    return { success: true, message: `Successfully seeded ${total} total documents.` };
  } catch (error) {
    console.error("Error seeding data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to seed data: ${errorMessage}` };
  }
}
