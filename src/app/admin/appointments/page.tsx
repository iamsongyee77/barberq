'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { cancelAppointment } from '@/lib/appointment-actions';
import { useAdminData } from '../layout';


export default function AppointmentsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { appointments: allAppointments, isLoading, refetchData: fetchAllAppointments } = useAdminData();

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelAlertOpen(true);
  }

  const handleConfirmCancel = async () => {
    if (!firestore || !selectedAppointment) return;
    try {
      await cancelAppointment(firestore, selectedAppointment.id);
      toast({
        title: "Appointment Cancelled",
        description: `The appointment for ${selectedAppointment.customerName} has been cancelled.`
      });
      await fetchAllAppointments(); // Refresh the list
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "An error occurred while cancelling the appointment.",
      });
    } finally {
      setIsCancelAlertOpen(false);
      setSelectedAppointment(null);
    }
  }


  return (
    <>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sortedAppointments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                    {appointment.startTime ? format(
                      (appointment.startTime as Timestamp).toDate(),
                      'PPp'
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{appointment.barberName}</TableCell>
                  <TableCell>{appointment.serviceName}</TableCell>
                  <TableCell>
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
                  <TableCell className="text-right">
                    {appointment.status !== 'Cancelled' && (
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {appointment.status === 'Confirmed' && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancelClick(appointment)}>
                                Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem disabled>Edit (soon)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will cancel the appointment for {selectedAppointment?.customerName}.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Confirm Cancellation</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
