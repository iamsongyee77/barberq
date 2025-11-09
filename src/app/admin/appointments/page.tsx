'use client';

import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';

import type { Appointment } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AppointmentsPage() {
  const firestore = useFirestore();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllAppointments = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        // 1. Fetch all customer documents
        const customersSnapshot = await getDocs(
          collection(firestore, 'customers')
        );

        // 2. Create an array of promises, each fetching the appointments for one customer
        const appointmentPromises = customersSnapshot.docs.map((customerDoc) =>
          getDocs(collection(firestore, 'customers', customerDoc.id, 'appointments'))
        );

        // 3. Resolve all promises
        const appointmentSnapshots = await Promise.all(appointmentPromises);

        // 4. Flatten the results into a single array of appointments
        const fetchedAppointments = appointmentSnapshots.flatMap((snapshot) =>
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment))
        );

        setAllAppointments(fetchedAppointments);
      } catch (error) {
        console.error('Error fetching all appointments:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load appointment data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAppointments();
  }, [firestore, toast]);

  const sortedAppointments = useMemo(() => {
    if (!allAppointments) return [];
    // Sort from newest to oldest
    return [...allAppointments].sort((a, b) =>
      ((b.startTime as Timestamp)?.toDate() || new Date(0)) >
      ((a.startTime as Timestamp)?.toDate() || new Date(0))
        ? 1
        : -1
    );
  }, [allAppointments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Appointments</CardTitle>
        <CardDescription>
          View and manage all appointments across the shop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sortedAppointments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-muted-foreground"
                >
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              sortedAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {appointment.customerName}
                  </TableCell>
                  <TableCell>
                    {format(
                      (appointment.startTime as Timestamp).toDate(),
                      'PPp'
                    )}
                  </TableCell>
                  <TableCell>{appointment.barberName}</TableCell>
                  <TableCell>{appointment.serviceName}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        appointment.status === 'Completed'
                          ? 'default'
                          : appointment.status === 'Confirmed'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
