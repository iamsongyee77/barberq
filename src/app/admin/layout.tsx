'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If auth is still loading, don't do anything yet.
    if (isUserLoading || !firestore) {
      return;
    }

    // If loading is finished and there's no user, redirect.
    if (!user) {
      router.replace('/');
      return;
    }

    const checkAuthorization = async () => {
      // Check if user is the admin
      if (user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
        return;
      }

      // Check if the user is a registered barber
      const barberRef = doc(firestore, 'barbers', user.uid);
      const barberSnap = await getDoc(barberRef);
      if (barberSnap.exists()) {
        setIsAuthorized(true);
        return;
      }
      
      // If neither, redirect
      router.replace('/');
    };

    checkAuthorization();

  }, [user, isUserLoading, router, firestore]);

  // While loading or if user is not yet confirmed as authorized, show a loading state.
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

  // If user is authorized, render the admin layout with its children.
  return (
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
  );
}
