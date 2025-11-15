'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  startOfDay,
  addMinutes,
  format,
  isSameDay,
} from 'date-fns';
import { collection, getDocs, Timestamp, query } from 'firebase/firestore';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Barber, Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const TIME_SLOTS_INTERVAL = 30; // in minutes

type AppointmentWithRefs = Appointment & {
  customerName: string;
  serviceName: string;
};

export default function TimelinePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithRefs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();
  const { toast } = useToast();

  const barbersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'barbers') : null),
    [firestore]
  );
  
  const customersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'customers') : null),
    [firestore]
  );
  

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const barbersSnapshot = await getDocs(query(collection(firestore, 'barbers')));
        const barbersData = barbersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Barber);
        setBarbers(barbersData);

        const customersSnapshot = await getDocs(query(collection(firestore, 'customers')));
        const appointmentPromises = customersSnapshot.docs.map(customerDoc => 
          getDocs(collection(firestore, 'customers', customerDoc.id, 'appointments'))
        );
        const appointmentSnapshots = await Promise.all(appointmentPromises);
        
        const allAppointments = appointmentSnapshots.flatMap(snapshot =>
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppointmentWithRefs))
        );

        setAppointments(allAppointments);
        
      } catch (error) {
         console.error('An unexpected error occurred fetching timeline data:', error);
         if (error instanceof FirestorePermissionError) {
            errorEmitter.emit('permission-error', error);
         } else {
             toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not load timeline data. Please try again.',
            });
         }
      }
       finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [firestore, toast, date]); // Re-fetch when date changes

  const timeSlots = useMemo(() => {
    const start = startOfDay(date);
    const slots = [];
    for (let i = 0; i < 48; i++) {
      // 48 slots of 30 minutes
      const slotTime = addMinutes(start, i * TIME_SLOTS_INTERVAL);
      if (
        slotTime.getHours() >= 8 &&
        slotTime.getHours() < 21
      ) {
        slots.push(slotTime);
      }
    }
    return slots;
  }, [date]);

  const getAppointmentForSlot = (
    barberId: string,
    slot: Date
  ): AppointmentWithRefs | undefined => {
    return appointments.find((appt) => {
      const startTime = (appt.startTime as Timestamp).toDate();
      const endTime = (appt.endTime as Timestamp).toDate();
      // An appointment "is for a slot" if the slot is within the appointment's duration, excluding the very end time.
      // This ensures an appointment starting at 10:00 and ending at 10:30 doesn't also render in the 10:30 slot.
      return (
        appt.barberId === barberId &&
        isSameDay(startTime, date) &&
        slot >= startTime && slot < endTime
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Daily Timeline</CardTitle>
            <CardDescription>
              View all bookings for a specific day across all barbers.
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => setDate(d || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardHeader>
      </Card>
      <div className="overflow-x-auto rounded-lg border">
        <div className="inline-grid min-w-full grid-cols-[auto_repeat(var(--barber-count),minmax(200px,1fr))]">
          {/* Header Row */}
          <div className="sticky top-0 z-10 border-b border-r bg-card p-4 font-semibold">
            Time
          </div>
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sticky top-0 z-10 border-b bg-card p-4 text-center">
                    <Skeleton className="h-6 w-24 mx-auto" />
                </div>
            ))
          ) : (
            barbers.map((barber) => (
            <div
              key={barber.id}
              className="sticky top-0 z-10 border-b bg-card p-4 text-center font-semibold"
            >
              {barber.name}
            </div>
          )))
          }

          {/* Time Slot Rows */}
          {timeSlots.map((slot) => (
            <div
              key={slot.toISOString()}
              className="contents"
            >
              <div
                className={cn(
                  'border-r p-4 text-right text-sm text-muted-foreground',
                  slot.getMinutes() === 0 && 'border-b font-medium'
                )}
              >
                {slot.getMinutes() === 0 ? format(slot, 'h a') : ''}
              </div>
              {isLoading ? (
                 Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border-b p-2">
                        <Skeleton className="h-full w-full min-h-[50px]"/>
                    </div>
                ))
              ): (
                barbers.map((barber) => {
                    const appointment = getAppointmentForSlot(barber.id, slot);
                    if (appointment) {
                    const startTime = (appointment.startTime as Timestamp).toDate();
                    if (slot.getTime() === startTime.getTime()) {
                        const endTime = (appointment.endTime as Timestamp).toDate();
                        const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                        const rowSpan = Math.ceil(durationInMinutes / TIME_SLOTS_INTERVAL);
                        return (
                        <div
                            key={barber.id}
                            className="overflow-hidden rounded-md border-l-4 border-primary bg-secondary/50 p-2 text-xs flex flex-col"
                            style={{
                            gridRow: `span ${rowSpan} / span ${rowSpan}`,
                            gridColumn: `${barbers.indexOf(barber) + 2}`,
                            }}
                        >
                            <div className="font-bold text-secondary-foreground">
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                            </div>
                            <div className="mt-1">
                                <p className="font-semibold text-secondary-foreground">{appointment.customerName}</p>
                                <p className="text-muted-foreground">{appointment.serviceName}</p>
                            </div>
                        </div>
                        );
                    }
                    return null;
                    }
                    return <div key={barber.id} className="border-b"></div>;
                })
              )}
            </div>
          ))}
        </div>
      </div>
       {/* CSS-in-JS for dynamic grid columns */}
      <style jsx>{`
        .inline-grid {
          --barber-count: ${barbers.length};
        }
      `}</style>
    </div>
  );
}
