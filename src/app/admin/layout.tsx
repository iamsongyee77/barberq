'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';
import type { Barber, Appointment } from '@/lib/types';

const ADMIN_EMAIL = "admin@example.com";

interface AdminContextType {
  barbers: Barber[];
  appointments: Appointment[];
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminData = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminLayout');
  }
  return context;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !firestore) return;

    if (!user) {
      router.replace('/');
      return;
    }

    const checkAuthorization = async () => {
      if (user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
        return;
      }
      const barberRef = doc(firestore, 'barbers', user.uid);
      const barberSnap = await getDoc(barberRef);
      if (barberSnap.exists()) {
        setIsAuthorized(true);
        return;
      }
      router.replace('/');
    };

    checkAuthorization();
  }, [user, isUserLoading, router, firestore]);

  useEffect(() => {
    if (!isAuthorized || !firestore) return;

    const fetchAdminData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch Barbers
        const barbersSnapshot = await getDocs(query(collection(firestore, 'barbers')));
        const barbersData = barbersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Barber);
        setBarbers(barbersData);

        // Fetch All Appointments
        const customersSnapshot = await getDocs(collection(firestore, 'customers'));
        const appointmentPromises = customersSnapshot.docs.map(customerDoc =>
          getDocs(collection(firestore, 'customers', customerDoc.id, 'appointments'))
        );
        const appointmentSnapshots = await Promise.all(appointmentPromises);
        const allAppointments = appointmentSnapshots.flatMap(snapshot =>
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        );
        setAppointments(allAppointments);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        // Handle error appropriately, maybe show a toast
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthorized, firestore]);

  if (isUserLoading || !isAuthorized || isDataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying access & loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ barbers, appointments, isLoading: isDataLoading }}>
      <SidebarProvider>
        <AdminNav />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger>
              <Button size="icon" variant="outline">
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SidebarTrigger>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminContext.Provider>
  );
}
