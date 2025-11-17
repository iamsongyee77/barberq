'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isFuture } from 'date-fns';
import { User, Mail, Phone, Clock, LogIn } from 'lucide-react';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase
} from '@/firebase';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cancelAppointment } from '@/lib/appointment-actions';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      where('customerId', '==', user.uid),
      orderBy('startTime', 'desc')
    );
  }, [firestore, user]);

  const { data: userAppointments, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useCollection<Appointment>(appointmentsQuery);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12 bg-background">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelAlertOpen(true);
  }

  const handleConfirmCancel = async () => {
    if (!firestore || !selectedAppointment || !user) return;
    try {
      await cancelAppointment(firestore, selectedAppointment.id);
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled."
      });
      // refetch is handled by useCollection automatically
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


  const customerName = user.displayName || user.email || 'Anonymous User';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8">
            My Profile
          </h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-4 ring-offset-background">
                    <AvatarImage
                      src={
                        user.photoURL ||
                        `https://avatar.vercel.sh/${user.uid}.png`
                      }
                      alt={customerName}
                    />
                    <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">{customerName}</CardTitle>
                  <CardDescription>Loyal Customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {user.isAnonymous && (
                     <div className="flex items-center p-3 rounded-md bg-secondary">
                      <LogIn className="h-4 w-4 mr-3 text-secondary-foreground" />
                      <span className='text-secondary-foreground'>You are signed in anonymously. <Button variant="link" className="p-0 h-auto" asChild><a href="/login">Sign up</a></Button> to save your profile.</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}
                  {user.metadata.creationTime && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>
                        Joined{' '}
                        {format(new Date(user.metadata.creationTime), 'MMMM yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment History</CardTitle>
                  <CardDescription>
                    Here's a list of your past and upcoming appointments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Barber</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAppointments &&
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-8 w-20 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))}
                      {userAppointments && userAppointments.length > 0 ? (
                        userAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              {appointment.startTime ? format(
                                (appointment.startTime as unknown as Timestamp).toDate(),
                                'PPp'
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>{appointment.serviceName}</TableCell>
                            <TableCell>{appointment.barberName}</TableCell>
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
                                {appointment.status === 'Confirmed' && appointment.startTime && isFuture((appointment.startTime as Timestamp).toDate()) && (
                                    <Button variant="outline" size="sm" onClick={() => handleCancelClick(appointment)}>
                                        Cancel
                                    </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        !isLoadingAppointments && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center h-24 text-muted-foreground"
                            >
                              You have no appointments yet. <Button variant="link" className="p-0 h-auto" asChild><a href="/booking">Book one now</a></Button>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
       <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will cancel your appointment for a {selectedAppointment?.serviceName} with {selectedAppointment?.barberName} on {selectedAppointment && selectedAppointment.startTime && format((selectedAppointment.startTime as Timestamp).toDate(), 'PPp')}.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmCancel}>Confirm Cancellation</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
