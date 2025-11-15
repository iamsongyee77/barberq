"use client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { DollarSign, Users, Calendar, Scissors } from "lucide-react"
import { collection, query, collectionGroup } from "firebase/firestore";
import { useMemo } from "react";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Service, Barber, Appointment } from "@/lib/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

  const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
  const barbersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'barbers')) : null, [firestore]);
  const appointmentsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'appointments')) : null, [firestore]);
  
  const { data: services } = useCollection<Service>(servicesQuery);
  const { data: barbers } = useCollection<Barber>(barbersQuery);
  const { data: appointments } = useCollection<Appointment>(appointmentsQuery);
  
  const completedAppointments = useMemo(() => appointments?.filter(a => a.status === 'Completed') || [], [appointments]);
  
  const totalRevenue = useMemo(() => completedAppointments.reduce((acc, appt) => {
    const service = services?.find(s => s.id === appt.serviceId);
    return acc + (service?.price || 0);
  }, 0), [completedAppointments, services]);

  const totalAppointments = appointments?.length || 0;
  
  const uniqueCustomers = useMemo(() => {
    if (!appointments) return 0;
    const customerIds = new Set(appointments.map(a => a.customerId));
    return customerIds.size;
  }, [appointments]);

  const totalBarbers = barbers?.length || 0;

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
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
            <p className="text-xs text-muted-foreground">Customers with appointments</p>
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
