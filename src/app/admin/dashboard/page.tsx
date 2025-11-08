"use client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { DollarSign, Users, Calendar, Scissors, Database, Wifi, WifiOff, Loader } from "lucide-react"
import { collection, query, collectionGroup } from "firebase/firestore";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Service, Barber, Appointment, Customer } from "@/lib/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { seedData } from "@/app/actions";
import { Badge } from "@/components/ui/badge";


const chartData = [
  { date: "Mon", total: Math.floor(Math.random() * 20) + 10 },
  { date: "Tue", total: Math.floor(Math.random() * 20) + 10 },
  { date: "Wed", total: Math.floor(Math.random() * 20) + 10 },
  { date: "Thu", total: Math.floor(Math.random() * 20) + 10 },
  { date: "Fri", total: Math.floor(Math.random() * 20) + 10 },
  { date: "Sat", total: Math.floor(Math.random() * 20) + 20 },
  { date: "Sun", total: Math.floor(Math.random() * 10) + 5 },
]

export default function DashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
  const barbersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'barbers')) : null, [firestore]);
  const appointmentsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'appointments')) : null, [firestore]);
  const customersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'customers')) : null, [firestore]);

  const { data: services } = useCollection<Service>(servicesQuery);
  const { data: barbers, isLoading: isLoadingBarbers, error: barbersError } = useCollection<Barber>(barbersQuery);
  const { data: appointments } = useCollection<Appointment>(appointmentsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const completedAppointments = appointments?.filter(a => a.status === 'Completed') || [];
  
  const totalRevenue = completedAppointments.reduce((acc, appt) => {
    const service = services?.find(s => s.id === appt.serviceId);
    return acc + (service?.price || 0);
  }, 0);

  const totalAppointments = appointments?.length || 0;
  const uniqueCustomers = customers?.length || 0;
  const totalBarbers = barbers?.length || 0;
  
  const handleSeedData = async () => {
    const response = await seedData();
    if (response.success) {
      toast({
        title: "Database Seeded!",
        description: response.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: response.error,
      });
    }
  }

  const renderDbStatus = () => {
    if (isLoadingBarbers) {
      return (
        <Badge variant="secondary" className="flex items-center gap-2">
          <Loader className="h-3 w-3 animate-spin" />
          <span>Connecting to Database...</span>
        </Badge>
      );
    }
    if (barbersError) {
      return (
        <Badge variant="destructive" className="flex items-center gap-2">
          <WifiOff className="h-3 w-3" />
          <span>Connection Error</span>
        </Badge>
      );
    }
    if (barbers && barbers.length > 0) {
      return (
        <Badge variant="secondary" className="flex items-center gap-2 bg-green-100 text-green-800 border-green-200">
          <Wifi className="h-3 w-3" />
          <span>Connected & Data Found</span>
        </Badge>
      );
    }
    return (
       <Badge variant="secondary" className="flex items-center gap-2">
        <Wifi className="h-3 w-3" />
        <span>Connected & Database is Empty</span>
      </Badge>
    )
  }


  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <div className="flex items-center gap-4">
          {renderDbStatus()}
          {process.env.NODE_ENV === "development" && (
              <Button variant="outline" onClick={handleSeedData} disabled={isLoadingBarbers || (barbers && barbers.length > 0)}>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database
              </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Total appointments recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">Customers served</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBarbers}</div>
            <p className="text-xs text-muted-foreground">Currently on the team</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Appointments This Week</CardTitle>
            <CardDescription>A summary of appointments scheduled for this week.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
