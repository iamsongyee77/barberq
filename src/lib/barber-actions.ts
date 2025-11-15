'use server';

import { 
    Firestore,
    doc,
    deleteDoc,
    collection,
    query,
    getDocs,
    writeBatch
} from 'firebase/firestore';

/**
 * Deletes a barber and all their associated sub-collection data (e.g., schedules).
 * @param firestore - The Firestore instance.
 * @param barberId - The ID of the barber to delete.
 */
export async function deleteBarber(firestore: Firestore, barberId: string): Promise<void> {
  if (!barberId) {
    throw new Error('Barber ID must be provided.');
  }

  const barberRef = doc(firestore, 'barbers', barberId);

  // Use a batch to delete the main document and all sub-collection documents atomically.
  const batch = writeBatch(firestore);

  // 1. Delete the barber document itself
  batch.delete(barberRef);

  // 2. Delete documents in the 'schedules' sub-collection
  const schedulesRef = collection(barberRef, 'schedules');
  const schedulesQuery = query(schedulesRef);
  const schedulesSnapshot = await getDocs(schedulesQuery);
  
  schedulesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // You can add more sub-collection deletions here if needed in the future

  // Commit the batch
  await batch.commit();
}
