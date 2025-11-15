'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc, collection, getDocs, query, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Barber, Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = "admin@example.com";

interface AdminContextType {
  barbers: Barber[];
  appointments: Appointment[];
  isLoading: boolean;
  refetchData: () => void;
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
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    if (!firestore) return;
    
    setIsDataLoading(true);
    try {
      // Fetch Barbers
      const barbersQuery = query(collection(firestore, 'barbers'));
      const barbersSnapshot = await getDocs(barbersQuery).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: 'barbers',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
      const barbersData = barbersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Barber);
      setBarbers(barbersData);

      // Fetch All Appointments
      const customersSnapshot = await getDocs(collection(firestore, 'customers')).catch(serverError => {
         const permissionError = new FirestorePermissionError({
          path: 'customers',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      const appointmentPromises = customersSnapshot.docs.map(customerDoc =>
        getDocs(collection(firestore, 'customers', customerDoc.id, 'appointments')).catch(serverError => {
          const permissionError = new FirestorePermissionError({
            path: `customers/${customerDoc.id}/appointments`,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          // Return an empty array for this customer to not block others
          return { docs: [] };
        })
      );
      
      const appointmentSnapshots = await Promise.all(appointmentPromises);

      const allAppointments = appointmentSnapshots.flatMap(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
      );
      setAppointments(allAppointments);

    } catch (error: any) {
       // Errors are now handled by being thrown or emitted inside the try block
       // We only catch to stop the loading state.
       if (!(error instanceof FirestorePermissionError)) {
          console.error("Failed to fetch admin data:", error);
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Could not load required admin data. " + error.message,
          });
       }
    } finally {
      setIsDataLoading(false);
    }
  }, [firestore, toast]);

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
      try {
        const barberRef = doc(firestore, 'barbers', user.uid);
        const barberSnap = await getDoc(barberRef);
        if (barberSnap.exists()) {
          setIsAuthorized(true);
          return;
        }
      } catch (error) {
        console.error("Authorization check failed:", error);
      }
      
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view this page."
      });
      router.replace('/');
    };

    checkAuthorization();
  }, [user, isUserLoading, router, firestore, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminData();
    }
  }, [isAuthorized, fetchAdminData]);

  if (isUserLoading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  const contextValue = {
    barbers,
    appointments,
    isLoading: isDataLoading,
    refetchData: fetchAdminData
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <SidebarProvider>
        <AdminNav />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger>
              <Button size="icon" variant="outline">
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SidebarTrigger>
             <SheetHeader className="sr-only">
               <SheetTitle>Navigation Menu</SheetTitle>
               <SheetDescription>Main navigation links for the application.</SheetDescription>
            </SheetHeader>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {isDataLoading ? (
               <div className="flex h-full w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                </div>
            ): children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AdminContext.Provider>
  );
}
