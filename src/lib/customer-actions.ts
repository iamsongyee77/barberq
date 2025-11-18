'use server';

import { 
    Firestore,
    doc,
    updateDoc,
    setDoc,
    collection
} from 'firebase/firestore';

interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * Creates or updates a customer in Firestore.
 * @param firestore - The Firestore instance.
 * @param customerId - The ID of the customer to update.
 * @param data - The data for the customer.
 */
export async function updateCustomer(
    firestore: Firestore,
    customerId: string,
    data: CustomerData
): Promise<void> {
    if (!customerId) {
        throw new Error("Customer ID is required to update.");
    }
    
    const customerRef = doc(firestore, 'customers', customerId);

    const customerData = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
    };

    await updateDoc(customerRef, customerData);
}
