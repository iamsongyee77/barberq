"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { format } from "date-fns";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Appointment, Customer } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type AggregatedAppointment = Appointment & { customerName: string };

export default function AppointmentsPage() {
  const firestore = useFirestore();
  const [allAppointments, setAllAppointments] = useState<AggregatedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'customers'));
  }, [firestore]);

  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

  useEffect(() => {
    const fetchAllAppointments = async () => {
      if (!firestore || !customers) {
        // Wait until customers are loaded
        if(!isLoadingCustomers) setIsLoading(false);
        return;
      };

      setIsLoading(true);
      const appointmentsPromises = customers.map(async (customer) => {
        if (!customer || !customer.id) return []; // Guard against undefined customer
        const appointmentsRef = collection(firestore, 'customers', customer.id, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsRef);
        return appointmentsSnapshot.docs.map(doc => ({
          ...(doc.data() as Appointment),
          id: doc.id,
          customerName: customer.name || 'Anonymous' // Fallback for customer name
        } as AggregatedAppointment));
      });

      const appointmentsNested = await Promise.all(appointmentsPromises);
      const flattenedAppointments = appointmentsNested.flat();
      flattenedAppointments.sort((a, b) => 
        (b.startTime as Timestamp).toMillis() - (a.startTime as Timestamp).toMillis()
      );
      
      setAllAppointments(flattenedAppointments);
      setIsLoading(false);
    };

    fetchAllAppointments();
  }, [customers, firestore, isLoadingCustomers]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>All Appointments</CardTitle>
        <CardDescription>View and manage all appointments across the shop.</CardDescription>
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
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && allAppointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && allAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.customerName}</TableCell>
                <TableCell>{format((appointment.startTime as Timestamp).toDate(), "PPp")}</TableCell>
                <TableCell>{appointment.barberName}</TableCell>
                <TableCell>{appointment.serviceName}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={
                      appointment.status === 'Completed' ? 'default' :
                      appointment.status === 'Confirmed' ? 'secondary' : 'destructive'
                  }>
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
