'use server';

import { 
    Firestore,
    doc,
    deleteDoc,
    collection,
    query,
    getDocs,
    writeBatch,
    where
} from 'firebase/firestore';

/**
 * Deletes a barber and all their associated schedules from the top-level collection.
 * @param firestore - The Firestore instance.
 * @param barberId - The ID of the barber to delete.
 */
export async function deleteBarber(firestore: Firestore, barberId: string): Promise<void> {
  if (!barberId) {
    throw new Error('Barber ID must be provided.');
  }

  const barberRef = doc(firestore, 'barbers', barberId);

  // Use a batch to delete the main document and all associated documents atomically.
  const batch = writeBatch(firestore);

  // 1. Delete the barber document itself
  batch.delete(barberRef);

  // 2. Query and delete documents in the 'schedules' collection where barberId matches
  const schedulesRef = collection(firestore, 'schedules');
  const schedulesQuery = query(schedulesRef, where("barberId", "==", barberId));
  const schedulesSnapshot = await getDocs(schedulesQuery);
  
  schedulesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // You can add more related data deletions here if needed in the future

  // Commit the batch
  await batch.commit();
}
