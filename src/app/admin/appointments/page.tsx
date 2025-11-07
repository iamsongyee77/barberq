"use client";

import { format, Timestamp } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsPage() {
  const firestore = useFirestore();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'appointments'), orderBy('startTime', 'desc'));
  }, [firestore]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>Manage all scheduled appointments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 5}).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
              </TableRow>
            ))}
            {appointments?.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.customerName}</TableCell>
                <TableCell>{appointment.barberName}</TableCell>
                <TableCell>{appointment.serviceName}</TableCell>
                <TableCell>{format((appointment.startTime as unknown as Timestamp).toDate(), "PPp")}</TableCell>
                <TableCell>
                  <Badge variant={
                    appointment.status === 'Completed' ? 'default' : 
                    appointment.status === 'Confirmed' ? 'secondary' : 'destructive'
                  }>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
