import { format } from "date-fns";
import { User, Calendar, Mail, Phone, Clock } from "lucide-react";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { customers, appointments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Using mock customer data
const customer = customers[0]; 

export default function ProfilePage() {
  const userAppointments = appointments.filter(a => a.customerId === customer.id);

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
                    <AvatarImage src={`https://picsum.photos/seed/${customer.id}/200/200`} alt={customer.name} />
                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">{customer.name}</CardTitle>
                  <CardDescription>Loyal Customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Joined {format(new Date(2022, 5, 15), "MMMM yyyy")}</span>
                  </div>
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
                      {userAppointments.length > 0 ? (
                        userAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">{format(appointment.startTime, "PPp")}</TableCell>
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
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            You have no appointments yet.
                          </TableCell>
                        </TableRow>
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
