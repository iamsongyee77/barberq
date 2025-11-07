"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNav } from '@/components/layout/admin-nav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth is still loading, don't do anything yet.
    if (isUserLoading) {
      return;
    }

    // If loading is finished and there's no user, or the user is not the admin, redirect.
    if (!user || user.email !== ADMIN_EMAIL) {
      router.replace('/'); // Use replace to avoid adding a back-button entry
    }
  }, [user, isUserLoading, router]);

  // While loading or if user is not yet confirmed as admin, show a loading state.
  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // If user is confirmed as admin, render the admin layout.
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
