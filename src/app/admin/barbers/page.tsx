'use client';

import { useState } from 'react';
import Image from "next/image";
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
  DropdownMenuSeparator
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
import { Skeleton } from '@/components/ui/skeleton';
import type { Barber } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarberEditor } from '@/components/admin/barber-editor';
import { ScheduleEditor } from '@/components/admin/schedule-editor';
import { Badge } from '@/components/ui/badge';
import { deleteBarber } from '@/lib/barber-actions';
import { useFirestore } from '@/firebase';

export default function BarbersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { barbers, isLoading, refetchData } = useAdminData();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  
  const handleEditBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsEditorOpen(true);
  }

  const handleEditSchedule = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsScheduleEditorOpen(true);
  }

  const handleDeleteBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsDeleteDialogOpen(true);
  }
  
  const confirmDelete = async () => {
    if (!selectedBarber || !firestore) return;
    try {
        await deleteBarber(firestore, selectedBarber.id);
        toast({
            title: "Barber Deleted",
            description: `${selectedBarber.name} has been removed from the team.`,
        });
        refetchData();
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

  const handleCloseDialogs = () => {
    setIsEditorOpen(false);
    setIsScheduleEditorOpen(false);
    setSelectedBarber(null);
    refetchData();
  }

  const handleAddBarber = () => {
    setSelectedBarber(null);
    setIsEditorOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Barbers</CardTitle>
            <CardDescription>Manage your team of barbers and their schedules.</CardDescription>
          </div>
          <Button onClick={handleAddBarber}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Barber
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Skills/Specialties</TableHead>
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
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && barbers.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                          No barbers found. Add one to get started.
                      </TableCell>
                  </TableRow>
              )}
              {!isLoading &&
                barbers.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar>
                            <AvatarImage src={barber.imageUrl} alt={barber.name} />
                            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{barber.name}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {barber.specialties.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditBarber(barber)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSchedule(barber)}>Edit Schedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
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
      
      <BarberEditor
        barber={selectedBarber}
        isOpen={isEditorOpen}
        onOpenChange={handleCloseDialogs}
      />
      
       <ScheduleEditor
        barber={selectedBarber}
        isOpen={isScheduleEditorOpen}
        onOpenChange={handleCloseDialogs}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {selectedBarber?.name} and all their associated data (including schedules).
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
