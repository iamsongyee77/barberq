'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
import { X, PlusCircle } from 'lucide-react';

const barberSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  specialties: z.array(z.string().min(1, {message: "Specialty can't be empty"})).min(1, { message: 'At least one specialty is required.' }),
});

type BarberFormData = z.infer<typeof barberSchema>;

interface BarberEditorProps {
  barber: Barber | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarberEditor({ barber, isOpen, onOpenChange }: BarberEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<BarberFormData>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: '',
      specialties: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specialties",
  });

  useEffect(() => {
    if (barber) {
      form.reset({
        name: barber.name,
        specialties: barber.specialties,
      });
    }
  }, [barber, form]);

  const onSubmit = async (data: BarberFormData) => {
    if (!firestore || !barber) return;

    try {
      const barberRef = doc(firestore, 'barbers', barber.id);
      await updateDoc(barberRef, {
        name: data.name,
        specialties: data.specialties,
      });
      toast({
        title: 'Barber Updated',
        description: `Successfully updated ${data.name}'s profile.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update barber:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while saving the barber profile.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Barber: {barber?.name}</DialogTitle>
          <DialogDescription>
            Update the barber's details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alex Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
                <FormLabel>Specialties</FormLabel>
                <div className="mt-2 space-y-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`specialties.${index}`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="e.g., Fades" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                     <FormMessage>{form.formState.errors.specialties?.message}</FormMessage>
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append("")}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Specialty
                </Button>
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
