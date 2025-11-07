"use server";

import { optimizeQueue, type OptimizeQueueInput } from "@/ai/flows/intelligent-queue-management";
import { appointments, barbers, services, customers } from "@/lib/data";

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
