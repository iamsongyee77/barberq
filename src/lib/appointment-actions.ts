'use server';

import { Firestore, doc, updateDoc } from 'firebase/firestore';

/**
 * Updates the status of an appointment to 'Cancelled'.
 * @param firestore - The Firestore instance.
 * @param customerId - The ID of the customer who owns the appointment.
 * @param appointmentId - The ID of the appointment to cancel.
 */
export async function cancelAppointment(
  firestore: Firestore,
  customerId: string,
  appointmentId: string
): Promise<void> {
  if (!customerId || !appointmentId) {
    throw new Error('Customer ID and Appointment ID must be provided.');
  }

  const appointmentRef = doc(
    firestore,
    'customers',
    customerId,
    'appointments',
    appointmentId
  );

  await updateDoc(appointmentRef, {
    status: 'Cancelled',
  });
}
