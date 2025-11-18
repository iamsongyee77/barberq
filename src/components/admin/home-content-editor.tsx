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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { PageContent } from '@/lib/types';


const contentSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required.'),
  heroHeadline: z.string().min(1, 'Headline is required.'),
  heroSubheadline: z.string().min(1, 'Subheadline is required.'),
  feature1Title: z.string().min(1, 'Title is required.'),
  feature1Description: z.string().min(1, 'Description is required.'),
  feature2Title: z.string().min(1, 'Title is required.'),
  feature2Description: z.string().min(1, 'Description is required.'),
  feature3Title: z.string().min(1, 'Title is required.'),
  feature3Description: z.string().min(1, 'Description is required.'),
  servicesTitle: z.string().min(1, 'Title is required.'),
  barbersTitle: z.string().min(1, 'Title is required.'),
});

type ContentFormData = z.infer<typeof contentSchema>;

export function HomeContentEditor() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pageContent', 'home');
  }, [firestore]);

  const { data: content, isLoading, refetch } = useDoc<PageContent>(contentRef);

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      shopName: 'SnipQueue',
      heroHeadline: '',
      heroSubheadline: '',
      feature1Title: '',
      feature1Description: '',
      feature2Title: '',
      feature2Description: '',
      feature3Title: '',
      feature3Description: '',
      servicesTitle: '',
      barbersTitle: '',
    },
  });

  useEffect(() => {
    if (content) {
      form.reset(content);
    }
  }, [content, form]);

  const onSubmit = async (data: ContentFormData) => {
    if (!firestore || !contentRef) return;
    setIsSubmitting(true);
    
    try {
      await setDoc(contentRef, data, { merge: true });
      toast({
        title: 'Content Saved',
        description: 'Home page content has been updated.',
      });
      refetch();
    } catch (error) {
      console.error('Failed to save home page content:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the content.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <fieldset className="space-y-4 p-4 border rounded-lg">
            <legend className="text-lg font-medium px-1">Branding</legend>
             <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                    <Input {...field} placeholder="Your Shop's Name" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </fieldset>
        
        <fieldset className="space-y-4 p-4 border rounded-lg">
            <legend className="text-lg font-medium px-1">Hero Section</legend>
            <FormField
                control={form.control}
                name="heroHeadline"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="heroSubheadline"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Subheadline</FormLabel>
                    <FormControl>
                    <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </fieldset>

        <fieldset className="space-y-4 p-4 border rounded-lg">
            <legend className="text-lg font-medium px-1">Features Section</legend>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <FormField control={form.control} name="feature1Title" render={({ field }) => (<FormItem><FormLabel>Feature 1 Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="feature1Description" render={({ field }) => (<FormItem><FormLabel>Feature 1 Desc.</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="space-y-2">
                    <FormField control={form.control} name="feature2Title" render={({ field }) => (<FormItem><FormLabel>Feature 2 Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="feature2Description" render={({ field }) => (<FormItem><FormLabel>Feature 2 Desc.</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="space-y-2">
                    <FormField control={form.control} name="feature3Title" render={({ field }) => (<FormItem><FormLabel>Feature 3 Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="feature3Description" render={({ field }) => (<FormItem><FormLabel>Feature 3 Desc.</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
        </fieldset>

         <fieldset className="space-y-4 p-4 border rounded-lg">
            <legend className="text-lg font-medium px-1">Section Titles</legend>
             <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="servicesTitle" render={({ field }) => (<FormItem><FormLabel>Services Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="barbersTitle" render={({ field }) => (<FormItem><FormLabel>Barbers Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
             </div>
        </fieldset>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Content
        </Button>
      </form>
    </Form>
  );
}
