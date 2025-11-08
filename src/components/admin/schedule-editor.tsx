'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Barber } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

type Schedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

interface ScheduleEditorProps {
  barber: Barber | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleEditor({ barber, isOpen, onOpenChange }: ScheduleEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Record<string, Partial<Schedule>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const barberSchedulesQuery = useMemoFirebase(() => {
    if (!firestore || !barber) return null;
    return collection(firestore, 'barbers', barber.id, 'schedules');
  }, [firestore, barber]);

  useEffect(() => {
    if (!barberSchedulesQuery || !isOpen) return;

    const fetchSchedules = async () => {
      setIsLoading(true);
      try {
        const snapshot = await getDocs(barberSchedulesQuery);
        const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
        
        const scheduleMap: Record<string, Partial<Schedule>> = {};
        DAYS_OF_WEEK.forEach(day => {
          const existing = fetchedSchedules.find(s => s.dayOfWeek === day);
          scheduleMap[day] = existing || { dayOfWeek: day, startTime: '', endTime: '' };
        });
        setSchedules(scheduleMap);

      } catch (error) {
        console.error("Failed to fetch schedules:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load barber's schedule."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [barberSchedulesQuery, isOpen, toast]);
  
  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedules(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSaveChanges = async () => {
    if (!firestore || !barber) return;
    setIsSaving(true);
    try {
      for (const day of DAYS_OF_WEEK) {
        const scheduleData = schedules[day];
        const { startTime, endTime } = scheduleData;
        
        // Only save if both times are provided, otherwise assume it's a day off
        if (startTime && endTime) {
          const scheduleId = scheduleData.id || `schedule_${barber.id}_${day.toLowerCase()}`;
          const scheduleRef = doc(firestore, 'barbers', barber.id, 'schedules', scheduleId);
          await setDoc(scheduleRef, {
            id: scheduleId,
            barberId: barber.id,
            dayOfWeek: day,
            startTime,
            endTime
          }, { merge: true });
        }
      }
      toast({
        title: "Schedule Updated",
        description: `Successfully updated the schedule for ${barber.name}.`
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save schedule:", error);
       toast({
        variant: "destructive",
        title: "Save Failed",
        description: "An error occurred while saving the schedule."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeForInput = (isoString: string | undefined) => {
    if (!isoString) return '';
    try {
      // Assuming the stored time is like 'HH:mm' or a full ISO string
      // We just need HH:mm for the input
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5);
    } catch (e) {
      // If it's already in HH:mm format
      if (typeof isoString === 'string' && isoString.match(/^\d{2}:\d{2}$/)) {
        return isoString;
      }
      return '';
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Schedule for {barber?.name}</DialogTitle>
          <DialogDescription>
            Set the available working hours for each day of the week. Leave times blank for days off.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {isLoading ? (
             Array.from({length: 7}).map((_, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             ))
          ) : (
            DAYS_OF_WEEK.map((day) => (
              <div key={day} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`${day}-start`} className="text-right font-semibold">
                  {day}
                </Label>
                <Input
                  id={`${day}-start`}
                  type="time"
                  value={schedules[day]?.startTime || ''}
                  onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                  className="col-span-1"
                />
                <Input
                  id={`${day}-end`}
                  type="time"
                  value={schedules[day]?.endTime || ''}
                  onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                  className="col-span-1"
                />
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
