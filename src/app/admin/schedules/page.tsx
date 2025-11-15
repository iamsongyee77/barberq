'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Barber, Schedule } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type BarberWithSchedule = Barber & { schedule: Record<string, string> };

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulesPage() {
  const firestore = useFirestore();
  const [barberSchedules, setBarberSchedules] = useState<BarberWithSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const barbersSnapshot = await getDocs(collection(firestore, 'barbers')).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: 'barbers',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        const barbersData = barbersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Barber[];

        const schedulesPromises = barbersData.map(async (barber) => {
          const scheduleCollectionRef = collection(firestore, 'barbers', barber.id, 'schedules');
          const scheduleSnapshot = await getDocs(scheduleCollectionRef).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: `barbers/${barber.id}/schedules`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            // Return an empty snapshot for this barber to not block others
            return { docs: [] };
          });

          const scheduleMap: Record<string, string> = {};
          const barberSchedulesData = scheduleSnapshot.docs.map(doc => doc.data() as Schedule);

          DAYS_OF_WEEK.forEach(day => {
            const daySchedule = barberSchedulesData.find(s => s.dayOfWeek === day);
            if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
              scheduleMap[day] = `${daySchedule.startTime} - ${daySchedule.endTime}`;
            } else {
              scheduleMap[day] = 'Day Off';
            }
          });

          return { ...barber, schedule: scheduleMap };
        });

        const fullScheduleData = await Promise.all(schedulesPromises);
        setBarberSchedules(fullScheduleData);

      } catch (error: any) {
        if (!(error instanceof FirestorePermissionError)) {
            console.error("Error fetching barber schedules:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load barber schedules. ' + error.message,
            });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [firestore, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barber Schedules</CardTitle>
        <CardDescription>A weekly overview of all barber schedules.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Barber</TableHead>
              {DAYS_OF_WEEK.map(day => (
                <TableHead key={day} className="text-center">{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  {DAYS_OF_WEEK.map(day => (
                    <TableCell key={day} className="text-center"><Skeleton className="h-5 w-28 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : barberSchedules.length > 0 ? (
              barberSchedules.map(barber => (
                <TableRow key={barber.id}>
                  <TableCell className="font-medium">{barber.name}</TableCell>
                  {DAYS_OF_WEEK.map(day => (
                    <TableCell key={day} className="text-center">
                      {barber.schedule[day] === 'Day Off' ? (
                        <Badge variant="outline">Day Off</Badge>
                      ) : (
                        barber.schedule[day]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={DAYS_OF_WEEK.length + 1} className="h-24 text-center">
                  No schedules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
