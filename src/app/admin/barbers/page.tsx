'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Barber } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ScheduleEditor } from '@/components/admin/schedule-editor';
import { BarberEditor } from '@/components/admin/barber-editor';
import { deleteBarber } from '@/lib/barber-actions';
import { useToast } from '@/hooks/use-toast';


export default function BarbersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [isBarberEditorOpen, setIsBarberEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const barbersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'barbers'), orderBy('name'));
  }, [firestore]);

  const { data: barbers, isLoading, refetch: refetchBarbers } = useCollection<Barber>(barbersQuery);
  
  const handleViewSchedule = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsScheduleEditorOpen(true);
  };
  
  const handleEditBarber = (barber: Barber | null) => {
    setSelectedBarber(barber);
    setIsBarberEditorOpen(true);
  };
  
  const handleDeleteBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (!firestore || !selectedBarber) return;
    try {
        await deleteBarber(firestore, selectedBarber.id);
        toast({
            title: "Barber Deleted",
            description: `${selectedBarber.name} has been removed from the system.`,
        });
    } catch (error) {
        console.error("Failed to delete barber:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting the barber.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedBarber(null);
    }
  }


  const handleCloseDialog = () => {
    setIsBarberEditorOpen(false);
    setIsScheduleEditorOpen(false);
    setSelectedBarber(null);
    refetchBarbers();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Barbers</CardTitle>
            <CardDescription>Manage your team of barbers.</CardDescription>
          </div>
          <Button onClick={() => handleEditBarber(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Barber
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <MoreHorizontal className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && barbers?.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                          No barbers found. Click "Add Barber" to get started.
                      </TableCell>
                  </TableRow>
              )}
              {!isLoading &&
                barbers?.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={barber.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={barber.imageUrl || `https://avatar.vercel.sh/${barber.id}.png`}
                        data-ai-hint={barber.imageHint}
                        width="64"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{barber.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {barber.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditBarber(barber)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewSchedule(barber)}>View Schedule</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBarber(barber)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {(isBarberEditorOpen || isScheduleEditorOpen) && (
        <>
          <ScheduleEditor 
            barber={selectedBarber}
            isOpen={isScheduleEditorOpen}
            onOpenChange={handleCloseDialog}
          />
          <BarberEditor
            barber={selectedBarber}
            isOpen={isBarberEditorOpen}
            onOpenChange={handleCloseDialog}
          />
        </>
      )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the barber's profile
                    and all associated data, including their schedules.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
