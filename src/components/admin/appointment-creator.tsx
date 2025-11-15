'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { add, format } from 'date-fns';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Barber, Service, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  serviceId: z.string().min(1, 'Service is required.'),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentCreatorProps {
  barber: Barber | null;
  startTime: Date | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAppointmentCreated: () => void;
}

export function AppointmentCreator({
  barber,
  startTime,
  isOpen,
  onOpenChange,
  onAppointmentCreated,
}: AppointmentCreatorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      serviceId: '',
    },
  });

  const servicesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'services') : null),
    [firestore]
  );
  const customersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'customers') : null),
    [firestore]
  );

  const { data: services, isLoading: isLoadingServices } =
    useCollection<Service>(servicesQuery);
  const { data: customers, isLoading: isLoadingCustomers } =
    useCollection<Customer>(customersQuery);
    
  const selectedServiceId = form.watch('serviceId');
  
  const appointmentDetails = useMemo(() => {
    if (!startTime || !selectedServiceId || !services) return null;
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return null;
    const endTime = add(startTime, { minutes: service.duration });
    return { endTime, service };
  }, [startTime, selectedServiceId, services]);


  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!firestore || !barber || !startTime || !appointmentDetails) return;

    setIsSubmitting(true);
    try {
        const customer = customers?.find(c => c.id === data.customerId);
        if (!customer) throw new Error("Selected customer not found.");

        const batch = writeBatch(firestore);
        const appointmentCollectionRef = collection(firestore, `customers/${data.customerId}/appointments`);
        const newAppointmentRef = doc(appointmentCollectionRef);

        const newAppointment = {
            id: newAppointmentRef.id,
            customerId: customer.id,
            customerName: customer.name,
            barberId: barber.id,
            barberName: barber.name,
            serviceId: appointmentDetails.service.id,
            serviceName: appointmentDetails.service.name,
            startTime: startTime,
            endTime: appointmentDetails.endTime,
            status: 'Confirmed',
            createdAt: serverTimestamp(),
        };

        batch.set(newAppointmentRef, newAppointment);
        await batch.commit();

        toast({
            title: 'Appointment Created!',
            description: `Booked ${appointmentDetails.service.name} for ${customer.name}.`,
        });
        onAppointmentCreated();
        onOpenChange(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'An error occurred while creating the appointment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isLoadingServices || isLoadingCustomers;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Booking for{' '}
            <span className="font-bold text-primary">{barber?.name}</span> at{' '}
            <span className="font-bold text-primary">
              {startTime ? format(startTime, 'PPp') : ''}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
            <div className="py-10 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {appointmentDetails && (
                <div className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">
                    Appointment will end at approximately <span className="font-semibold text-foreground">{format(appointmentDetails.endTime, 'h:mm a')}</span>.
                </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Booking...' : 'Create Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
