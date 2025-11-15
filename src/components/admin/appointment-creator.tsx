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
} from 'firebase/firestore';
import { add, format } from 'date-fns';
import { Check, ChevronsUpDown, Loader2, Phone } from 'lucide-react';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Barber, Service, Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const appointmentSchema = z.object({
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
  serviceId: z.string().min(1, 'Service is required.'),
}).refine(data => !!data.customerId || !!data.newCustomerName, {
  message: "Please select an existing customer or enter a new customer's name.",
  path: ["customerId"],
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
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      newCustomerName: '',
      newCustomerPhone: '',
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

  const { data: services, isLoading: isLoadingServices, } = useCollection<Service>(servicesQuery);
  const { data: customers, isLoading: isLoadingCustomers, refetch: refetchCustomers } = useCollection<Customer>(customersQuery);
    
  const selectedServiceId = form.watch('serviceId');
  const newCustomerName = form.watch('newCustomerName');
  
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
      setCustomerSearch("");
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!firestore || !barber || !startTime || !appointmentDetails) return;

    setIsSubmitting(true);
    try {
        let customerId = data.customerId;
        let customerName = customers?.find(c => c.id === customerId)?.name;

        const batch = writeBatch(firestore);

        if (data.newCustomerName && !customerId) {
            customerName = data.newCustomerName;
            const newCustomerRef = doc(collection(firestore, 'customers'));
            const pseudoEmail = `${data.newCustomerName.replace(/\s+/g, '.').toLowerCase()}@walkin.com`;
            
            batch.set(newCustomerRef, {
                id: newCustomerRef.id,
                name: customerName,
                email: pseudoEmail,
                phone: data.newCustomerPhone || '',
            });
            customerId = newCustomerRef.id;
        }

        if (!customerId || !customerName) {
            throw new Error("Customer information is incomplete.");
        }

        const appointmentCollectionRef = collection(firestore, `customers/${customerId}/appointments`);
        const newAppointmentRef = doc(appointmentCollectionRef);

        const newAppointment = {
            id: newAppointmentRef.id,
            customerId: customerId,
            customerName: customerName,
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
        
        await refetchCustomers(); // Refetch customers to include the new one

        toast({
            title: 'Appointment Created!',
            description: `Booked ${appointmentDetails.service.name} for ${customerName}.`,
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

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!customerSearch) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const showCreateOption = customerSearch && !filteredCustomers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase());


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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Customer</FormLabel>
                  <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && !form.getValues("newCustomerName") && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? customers?.find(
                                (customer) => customer.id === field.value
                              )?.name
                            : form.getValues("newCustomerName") || "Select or create a customer"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search or create customer..." 
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {showCreateOption ? null : "No customer found."}
                          </CommandEmpty>
                          <CommandGroup>
                             {showCreateOption && (
                                <CommandItem
                                  onSelect={() => {
                                    form.setValue("newCustomerName", customerSearch);
                                    form.setValue("customerId", "");
                                    setCustomerPopoverOpen(false);
                                  }}
                                >
                                  Create new customer: "{customerSearch}"
                                </CommandItem>
                              )}
                            {filteredCustomers.map((customer) => (
                              <CommandItem
                                value={customer.name}
                                key={customer.id}
                                onSelect={() => {
                                  form.setValue("customerId", customer.id);
                                  form.setValue("newCustomerName", "");
                                  form.setValue("newCustomerPhone", "");
                                  setCustomerSearch("");
                                  setCustomerPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    customer.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {newCustomerName && (
              <FormField
                control={form.control}
                name="newCustomerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Customer Phone</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., 081-234-5678" {...field} className="pl-10"/>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
