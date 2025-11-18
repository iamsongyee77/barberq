'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, doc, getDocs, setDoc, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { Barber, Schedule as ScheduleType } from '@/lib/types';
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
import { Loader2 } from 'lucide-react';

type ShopHours = {
  startTime: string;
  endTime: string;
}

interface ScheduleEditorProps {
  barber: Barber | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleEditor({ barber, isOpen, onOpenChange }: ScheduleEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Record<string, Partial<ScheduleType>>>({});
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shopHoursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'shopSettings', 'hours');
  }, [firestore]);
  
  const { data: shopHours, isLoading: isLoadingShopHours } = useDoc<ShopHours>(shopHoursRef);

  const barberSchedulesQuery = useMemoFirebase(() => {
    if (!firestore || !barber) return null;
    return query(collection(firestore, 'schedules'), where('barberId', '==', barber.id));
  }, [firestore, barber]);

  useEffect(() => {
    if (!barberSchedulesQuery || !isOpen) return;

    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        const snapshot = await getDocs(barberSchedulesQuery);
        const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScheduleType[];
        
        const scheduleMap: Record<string, Partial<ScheduleType>> = {};
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
        setIsLoadingSchedules(false);
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

  const handleAutoSchedule = (day: string) => {
    if (!shopHours) {
        toast({ title: "Cannot set auto schedule", description: "Shop hours are not configured yet."});
        return;
    }
    setSchedules(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime: shopHours.startTime,
        endTime: shopHours.endTime,
      }
    }));
  };

  const handleClearSchedule = (day: string) => {
     setSchedules(prev => ({
      ...prev,
      [day]: { ...prev[day], startTime: '', endTime: '' }
    }));
  }

  const handleSaveChanges = async () => {
    if (!firestore || !barber) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);

      for (const day of DAYS_OF_WEEK) {
        const scheduleData = schedules[day];
        const { startTime, endTime } = scheduleData;
        const scheduleId = scheduleData.id || `schedule_${barber.id}_${day.toLowerCase()}`;
        const scheduleRef = doc(firestore, 'schedules', scheduleId);
        
        if (startTime && endTime) {
          // If times are provided, create or update the document
          batch.set(scheduleRef, {
            id: scheduleId,
            barberId: barber.id,
            dayOfWeek: day,
            startTime,
            endTime
          }, { merge: true });
        } else if (scheduleData.id) {
          // If times are blank but the document exists, it's a day off, so delete it
          batch.delete(scheduleRef);
        }
      }
      
      await batch.commit();

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

  const isLoading = isLoadingSchedules || isLoadingShopHours;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Schedule for {barber?.name}</DialogTitle>
          <DialogDescription>
            Set the available working hours for each day of the week. Leave times blank for days off.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading ? (
             Array.from({length: 7}).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex gap-2 col-span-1 md:col-span-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>
             ))
          ) : (
            DAYS_OF_WEEK.map((day) => (
              <div key={day} className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                <Label htmlFor={`${day}-start`} className="md:text-right font-semibold">
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
                <div className="flex gap-2 col-span-1 md:col-span-2">
                    <Button variant="outline" size="sm" onClick={() => handleAutoSchedule(day)} disabled={!shopHours}>Auto</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleClearSchedule(day)}>Clear</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
