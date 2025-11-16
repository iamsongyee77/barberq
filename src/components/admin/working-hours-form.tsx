'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const workingHoursSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;

type ShopHours = {
  id: string;
  startTime: string;
  endTime: string;
}

export function WorkingHoursForm() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shopHoursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    // The document ID for shop hours is hardcoded as 'hours'
    return doc(firestore, 'shopSettings', 'hours');
  }, [firestore]);

  const { data: shopHours, isLoading, refetch } = useDoc<ShopHours>(shopHoursRef);

  const form = useForm<WorkingHoursFormData>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '18:00',
    },
  });

  useEffect(() => {
    if (shopHours) {
      form.reset({
        startTime: shopHours.startTime,
        endTime: shopHours.endTime,
      });
    }
  }, [shopHours, form]);

  const onSubmit = async (data: WorkingHoursFormData) => {
    if (!firestore || !shopHoursRef) return;
    setIsSubmitting(true);
    
    try {
      await setDoc(shopHoursRef, data, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Shop working hours have been updated.',
      });
      refetch(); // Refetch data to ensure UI is up-to-date
    } catch (error) {
      console.error('Failed to save working hours:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
}
