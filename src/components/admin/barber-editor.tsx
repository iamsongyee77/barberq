'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
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
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')),
  specialties: z.array(z.string().min(1, {message: "Specialty can't be empty"})).min(1, { message: 'At least one specialty is required.' }),
});

type BarberFormData = z.infer<typeof barberSchema>;

interface BarberEditorProps {
  barber: Barber | null; // Null for creation mode
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BarberEditor({ barber, isOpen, onOpenChange }: BarberEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BarberFormData>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
      specialties: [''],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specialties",
  });

  useEffect(() => {
    if (isOpen) {
      if (barber) {
        form.reset({
          name: barber.name || '',
          imageUrl: barber.imageUrl || '',
          specialties: barber.specialties.length > 0 ? barber.specialties : [''],
        });
      } else {
          form.reset({
              name: '',
              imageUrl: '',
              specialties: [''],
          });
      }
    }
  }, [barber, isOpen, form.reset]);

  const onSubmit = async (data: BarberFormData) => {
    if (!firestore) return;
    setIsSubmitting(true);

    const barberData = {
        name: data.name,
        imageUrl: data.imageUrl || `https://avatar.vercel.sh/${data.name.replace(/\s+/g, '-')}.png`,
        imageHint: 'male portrait',
        specialties: data.specialties,
    };

    try {
      if (barber) {
        // Update existing barber
        const barberRef = doc(firestore, 'barbers', barber.id);
        await updateDoc(barberRef, barberData);
        toast({
          title: 'Barber Updated',
          description: `Successfully updated ${data.name}'s profile.`,
        });
      } else {
        // Create new barber
        const barberCollectionRef = collection(firestore, 'barbers');
        const newDocRef = doc(barberCollectionRef);
        await addDoc(barberCollectionRef, { ...barberData, id: newDocRef.id });
        toast({
          title: 'Barber Added',
          description: `${data.name} has been added to the team.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save barber:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the barber profile.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{barber ? `Edit Barber: ${barber.name}` : 'Add New Barber'}</DialogTitle>
          <DialogDescription>
            {barber ? "Update the barber's details below." : "Enter the new barber's details to add them to the team."}
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
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png (leave blank for default)" {...field} />
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
                                     <FormMessage />
                                </FormItem>
                            )}
                        />
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                    ))}
                     <FormMessage>{form.formState.errors.specialties?.root?.message}</FormMessage>
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
