'use server';

import { 
    Firestore,
    doc,
    deleteDoc,
    setDoc,
    collection
} from 'firebase/firestore';

interface ServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
}

/**
 * Creates or updates a service in Firestore.
 * @param firestore - The Firestore instance.
 * @param serviceId - The ID of the service to update, or null to create a new one.
 * @param data - The data for the service.
 */
export async function createOrUpdateService(
    firestore: Firestore,
    serviceId: string | null,
    data: ServiceData
): Promise<void> {
    const serviceRef = serviceId 
        ? doc(firestore, 'services', serviceId) 
        : doc(collection(firestore, 'services'));

    const serviceData = {
        ...data,
        id: serviceRef.id,
        // Generate a generic image hint, can be improved later
        imageHint: data.name.toLowerCase().split(' ').slice(0,2).join(' ') || 'hair service'
    };

    await setDoc(serviceRef, serviceData, { merge: true });
}

/**
 * Deletes a service from Firestore.
 * @param firestore - The Firestore instance.
 * @param serviceId - The ID of the service to delete.
 */
export async function deleteService(firestore: Firestore, serviceId: string): Promise<void> {
  if (!serviceId) {
    throw new Error('Service ID must be provided.');
  }
  const serviceRef = doc(firestore, 'services', serviceId);
  await deleteDoc(serviceRef);
}
