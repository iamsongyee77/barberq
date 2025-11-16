'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import type { Service } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateService } from '@/lib/service-actions';

const serviceSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().min(0, { message: 'Price must be a positive number.' }),
  duration: z.coerce.number().int().min(5, { message: 'Duration must be at least 5 minutes.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL for the image.' }),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceEditorProps {
  service: Service | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ServiceEditor({ service, isOpen, onOpenChange }: ServiceEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen && service) {
      form.reset({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        imageUrl: service.imageUrl,
      });
    } else if (isOpen && !service) {
      // Reset to default for new service creation
      form.reset({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        imageUrl: 'https://picsum.photos/seed/new-service/400/250',
      });
    }
  }, [isOpen, service, form]);

  const onSubmit = async (data: ServiceFormData) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      await createOrUpdateService(firestore, service?.id || null, data);
      toast({
        title: service ? 'Service Updated' : 'Service Created',
        description: `Successfully ${service ? 'updated' : 'created'} the service: ${data.name}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the service.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? `Edit Service: ${service.name}` : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {service ? "Update the service details below." : "Enter the new service's details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Classic Haircut" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the service..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (฿)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
