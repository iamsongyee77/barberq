'use client';

import { useState, useEffect } from 'react';
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
import { useAdminData } from '../layout';

type BarberWithSchedule = Barber & { schedule: Record<string, string> };

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulesPage() {
  const { barbers, schedules: allSchedulesData, isLoading } = useAdminData();
  const [barberSchedules, setBarberSchedules] = useState<BarberWithSchedule[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading || !barbers || !allSchedulesData) {
        if (!isLoading) {
             setBarberSchedules([]);
        }
        return;
    };

    try {
        const fullScheduleData = barbers.map(barber => {
            const scheduleMap: Record<string, string> = {};
            const schedulesForBarber = allSchedulesData.filter(s => s.barberId === barber.id);

            DAYS_OF_WEEK.forEach(day => {
                const daySchedule = schedulesForBarber.find(s => s.dayOfWeek === day);
                if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
                  scheduleMap[day] = `${daySchedule.startTime} - ${daySchedule.endTime}`;
                } else {
                  scheduleMap[day] = 'Day Off';
                }
            });
            return { ...barber, schedule: scheduleMap };
        });

        setBarberSchedules(fullScheduleData);

    } catch (error: any) {
        console.error("Error processing barber schedules:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not process barber schedules. ' + error.message,
        });
    }
  }, [isLoading, barbers, allSchedulesData, toast]);

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
