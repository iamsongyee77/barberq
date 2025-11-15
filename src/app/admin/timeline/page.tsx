'use client';

import { useState, useMemo } from 'react';
import {
  startOfDay,
  addMinutes,
  format,
  isSameDay,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Appointment } from '@/lib/types';
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
import { useAdminData } from '../layout';


const TIME_SLOTS_INTERVAL = 30; // in minutes

type AppointmentWithRefs = Appointment & {
  customerName: string;
  serviceName: string;
};

export default function TimelinePage() {
  const [date, setDate] = useState<Date>(new Date());
  const { barbers, appointments, isLoading } = useAdminData();

  const timeSlots = useMemo(() => {
    const start = startOfDay(date);
    const slots = [];
    for (let i = 0; i < 48; i++) { // 48 slots of 30 minutes
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
      if (!appt.startTime) return false;
      const startTime = (appt.startTime as Timestamp).toDate();
      const endTime = (appt.endTime as Timestamp).toDate();
      return (
        appt.barberId === barberId &&
        isSameDay(startTime, date) &&
        slot >= startTime && slot < endTime
      );
    }) as AppointmentWithRefs | undefined;
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
        <div className="inline-grid min-w-full" style={{ gridTemplateColumns: `auto repeat(${barbers.length}, minmax(200px, 1fr))`}}>
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
                 Array.from({ length: barbers.length || 4 }).map((_, i) => (
                    <div key={i} className="border-b p-2">
                        <Skeleton className="h-full w-full min-h-[50px]"/>
                    </div>
                ))
              ): (
                barbers.map((barber, barberIndex) => {
                    const appointment = getAppointmentForSlot(barber.id, slot);
                    if (appointment) {
                      const startTime = (appointment.startTime as Timestamp).toDate();
                      // Only render the appointment block if this is the exact start slot
                      if (slot.getTime() === startTime.getTime()) {
                          const endTime = (appointment.endTime as Timestamp).toDate();
                          const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                          const rowSpan = Math.ceil(durationInMinutes / TIME_SLOTS_INTERVAL);
                          return (
                          <div
                              key={barber.id}
                              className="overflow-hidden rounded-md border-l-4 border-primary bg-secondary/50 p-2 text-xs flex flex-col relative"
                              style={{
                                gridRow: `span ${rowSpan} / span ${rowSpan}`,
                                gridColumn: `${barberIndex + 2}`, // +2 because of the time column at the start
                                zIndex: 10, // Ensure it's above the empty slots
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
                      // If this slot is covered by an appointment but is not the start, render nothing to avoid overlap.
                      return null; 
                    }
                    // This is an empty slot
                    return <div key={barber.id} className="border-b"></div>;
                })
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
