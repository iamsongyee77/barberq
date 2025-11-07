"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

import type { Appointment } from "@/lib/types";
import { appointments as mockAppointments } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsPage() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setIsLoading(true);
    const sortedAppointments = [...mockAppointments].sort((a, b) => 
      (b.startTime as Date).getTime() - (a.startTime as Date).getTime()
    );
    setAllAppointments(sortedAppointments);
    setIsLoading(false);
  }, []);

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
                <TableCell>{format((appointment.startTime as Date), "PPp")}</TableCell>
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
