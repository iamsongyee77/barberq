'use server';

import { Firestore, doc, updateDoc } from 'firebase/firestore';

/**
 * Updates the status of an appointment to 'Cancelled'.
 * @param firestore - The Firestore instance.
 * @param appointmentId - The ID of the appointment to cancel.
 */
export async function cancelAppointment(
  firestore: Firestore,
  appointmentId: string
): Promise<void> {
  if (!appointmentId) {
    throw new Error('Appointment ID must be provided.');
  }

  const appointmentRef = doc(
    firestore,
    'appointments',
    appointmentId
  );

  await updateDoc(appointmentRef, {
    status: 'Cancelled',
  });
}

    