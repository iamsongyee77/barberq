"use client"

import { format } from "date-fns";
import { User, Calendar, Mail, Phone, Clock, LogIn } from "lucide-react";
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, initiateAnonymousSignIn, useAuth } from "@/firebase";
import type { Appointment, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers', user.uid, 'appointments'), orderBy('startTime', 'desc'));
  }, [firestore, user]);

  const { data: userAppointments, isLoading: isLoadingAppointments } = useCollection<Appointment>(appointmentsQuery);

  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12 bg-background">
          <div className="container mx-auto px-4 flex justify-center items-center">
            <p>Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
             <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Please Sign In</CardTitle>
                <CardDescription>To view your profile and appointments, you need to sign in.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => initiateAnonymousSignIn(auth)}>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In Anonymously
                </Button>
                 <p className="text-xs text-muted-foreground mt-4">For a full experience, sign up with email.</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const customerName = user.displayName || user.email || "Anonymous User";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8">My Profile</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-4 ring-offset-background">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} alt={customerName} />
                    <AvatarFallback>{customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">{customerName}</CardTitle>
                  <CardDescription>Loyal Customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {user.email && <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>}
                  {user.phoneNumber && <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{user.phoneNumber}</span>
                  </div>}
                  {user.metadata.creationTime && <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Joined {format(new Date(user.metadata.creationTime), "MMMM yyyy")}</span>
                  </div>}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment History</CardTitle>
                  <CardDescription>Here's a list of your past and upcoming appointments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Barber</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAppointments && Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        </TableRow>
                      ))}
                      {userAppointments && userAppointments.length > 0 ? (
                        userAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">{format((appointment.startTime as unknown as Timestamp).toDate(), "PPp")}</TableCell>
                            <TableCell>{appointment.serviceName}</TableCell>
                            <TableCell>{appointment.barberName}</TableCell>
                            <TableCell>
                              <Badge variant={
                                appointment.status === 'Completed' ? 'default' : 
                                appointment.status === 'Confirmed' ? 'secondary' : 'destructive'
                              }>
                                {appointment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        !isLoadingAppointments && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              You have no appointments yet.
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
    </div>
  );
}
