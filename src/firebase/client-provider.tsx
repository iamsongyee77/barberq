'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { placeholderImages } from "@/lib/placeholder-images.json";

// Default data to seed the database
const findImage = (id: string) => {
  const img = placeholderImages.find(p => p.id === id);
  return {
    url: img?.imageUrl || `https://picsum.photos/seed/${id}/400/400`,
    hint: img?.imageHint || "placeholder"
  };
};

const today = new Date();
const availability = [
  { startTime: new Date(today.setHours(9, 0, 0, 0)).toISOString(), endTime: new Date(today.setHours(12, 0, 0, 0)).toISOString() },
  { startTime: new Date(today.setHours(13, 0, 0, 0)).toISOString(), endTime: new Date(today.setHours(18, 0, 0, 0)).toISOString() },
];

const defaultBarbers = [
  { id: 'b1', name: 'Alex Johnson', specialties: ['Fades', 'Classic Cuts'], imageUrl: findImage('barber1').url, imageHint: findImage('barber1').hint, availability },
  { id: 'b2', name: 'Ben Carter', specialties: ['Beards', 'Shaves'], imageUrl: findImage('barber2').url, imageHint: findImage('barber2').hint, availability },
  { id: 'b3', name: 'Chloe Davis', specialties: ['Long Hair', 'Coloring'], imageUrl: findImage('barber3').url, imageHint: findImage('barber3').hint, availability },
  { id: 'b4', name: 'David Rodriguez', specialties: ["Kid's Cuts", 'Modern Styles'], imageUrl: findImage('barber4').url, imageHint: findImage('barber4').hint, availability },
];

const defaultServices = [
  { id: 's1', name: 'Classic Haircut', description: 'A timeless cut, tailored to your style.', price: 40, duration: 45, imageUrl: findImage('service1').url, imageHint: findImage('service1').hint },
  { id: 's2', name: 'Beard Trim', description: 'Shape and refine your beard to perfection.', price: 25, duration: 30, imageUrl: findImage('service2').url, imageHint: findImage('service2').hint },
  { id: 's3', name: 'Hot Towel Shave', description: 'A luxurious and close shave experience.', price: 45, duration: 45, imageUrl: findImage('service3').url, imageHint: findImage('service3').hint },
  { id: 's4', name: "Kid's Cut", description: 'A great haircut for our younger clients (under 12).', price: 30, duration: 30, imageUrl: findImage('service4').url, imageHint: findImage('service4').hint },
  { id: 's5', name: 'Hair Coloring', description: 'Full-head professional hair coloring service.', price: 80, duration: 90, imageUrl: findImage('service5').url, imageHint: findImage('service5').hint },
];


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const seedDatabase = async () => {
      if (!firebaseServices.firestore) return;

      const barbersRef = collection(firebaseServices.firestore, 'barbers');
      const servicesRef = collection(firebaseServices.firestore, 'services');
      
      const barbersSnapshot = await getDocs(barbersRef);
      const servicesSnapshot = await getDocs(servicesRef);

      const batch = writeBatch(firebaseServices.firestore);
      let hasChanges = false;

      if (barbersSnapshot.empty) {
        console.log("No barbers found, seeding database...");
        hasChanges = true;
        defaultBarbers.forEach(barber => {
          const docRef = doc(firebaseServices.firestore, 'barbers', barber.id);
          batch.set(docRef, barber);
        });
      }

      if (servicesSnapshot.empty) {
        console.log("No services found, seeding database...");
        hasChanges = true;
        defaultServices.forEach(service => {
          const docRef = doc(firebaseServices.firestore, 'services', service.id);
          batch.set(docRef, service);
        });
      }

      if (hasChanges) {
        await batch.commit();
        console.log("Database seeded successfully.");
      }
    };

    seedDatabase().catch(console.error);
  }, [firebaseServices.firestore]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
