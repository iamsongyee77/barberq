'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';
import type { Barber, Appointment, Schedule, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAILS } from '@/lib/types';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface AdminContextType {
  barbers: Barber[];
  appointments: Appointment[];
  schedules: Schedule[];
  customers: Customer[];
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
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    if (!firestore) return;
    
    setIsDataLoading(true);
    try {
      const barbersQuery = query(collection(firestore, 'barbers'));
      const appointmentsQuery = query(collection(firestore, 'appointments'));
      const schedulesQuery = query(collection(firestore, 'schedules'));
      const customersQuery = query(collection(firestore, 'customers'));
      
      const [barbersSnapshot, appointmentsSnapshot, schedulesSnapshot, customersSnapshot] = await Promise.all([
        getDocs(barbersQuery).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'barbers', operation: 'list' });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        }),
        getDocs(appointmentsQuery).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'appointments', operation: 'list' });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        }),
         getDocs(schedulesQuery).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'schedules', operation: 'list' });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        }),
        getDocs(customersQuery).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'customers', operation: 'list' });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        }),
      ]);

      const barbersData = barbersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Barber);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Appointment);
      const schedulesData = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Schedule);
      const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);

      setBarbers(barbersData);
      setAppointments(appointmentsData);
      setSchedules(schedulesData);
      setCustomers(customersData);

    } catch (error: any) {
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
      let isAuth = false;
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        isAuth = true;
      } else {
        try {
          const barberRef = doc(firestore, 'barbers', user.uid);
          const barberSnap = await getDoc(barberRef);
          if (barberSnap.exists()) {
            isAuth = true;
          }
        } catch (error) {
          console.error("Authorization check failed:", error);
        }
      }
      
      if (isAuth) {
        setIsAuthorized(true);
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page."
        });
        router.replace('/');
      }
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
    schedules,
    customers,
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
