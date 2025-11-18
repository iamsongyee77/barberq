'use client';

import React, { useState, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer, Barber } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerEditor } from '@/components/admin/customer-editor';
import { BarberEditor } from '@/components/admin/barber-editor';
import { Badge } from '@/components/ui/badge';
import { deleteBarber } from '@/lib/barber-actions';
import { useFirestore } from '@/firebase';

type User = (Customer | Barber) & { role: 'Customer' | 'Barber' };

export default function UsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { customers, barbers, isLoading, refetchData } = useAdminData();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const users = useMemo(() => {
    const combined: User[] = [];
    if (customers) {
        combined.push(...customers.map(c => ({ ...c, role: 'Customer' as const })));
    }
    if (barbers) {
        combined.push(...barbers.map(b => ({ ...b, role: 'Barber' as const })));
    }
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, barbers]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditorOpen(true);
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (!selectedUser || !firestore) return;
    try {
      if (selectedUser.role === 'Barber') {
        await deleteBarber(firestore, selectedUser.id);
         toast({
            title: "Barber Deleted",
            description: `${selectedUser.name} has been removed from the system.`,
        });
      } else {
        // Placeholder for customer deletion
        console.log("Deleting customer:", selectedUser.id);
        await new Promise(res => setTimeout(res, 500)); // Simulate async operation
        toast({
            title: "Customer Deleted",
            description: `${selectedUser.name} has been removed from the system.`,
        });
      }
      refetchData();
    } catch (error) {
        console.error("Failed to delete user:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting the user.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
    }
  }

  const handleCloseDialog = () => {
    setIsEditorOpen(false);
    setSelectedUser(null);
    refetchData();
  }

  const handleAddBarber = () => {
    setSelectedUser(null);
    setIsEditorOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage all customers and barbers in the system.</CardDescription>
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
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && users.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                      </TableCell>
                  </TableRow>
              )}
              {!isLoading &&
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar>
                            <AvatarImage src={(user as Barber).imageUrl || `https://avatar.vercel.sh/${user.id}.png`} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'Barber' ? 'secondary' : 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                        <div>{user.email}</div>
                        <div className="text-muted-foreground text-sm">{user.phone || ''}</div>
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
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>
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

      {selectedUser?.role === 'Customer' ? (
        <CustomerEditor
          customer={selectedUser as Customer}
          isOpen={isEditorOpen && selectedUser?.role === 'Customer'}
          onOpenChange={handleCloseDialog}
        />
      ) : (
         <BarberEditor
            barber={selectedUser as Barber | null}
            isOpen={isEditorOpen}
            onOpenChange={handleCloseDialog}
          />
      )}
     

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selectedUser?.name}'s account and all associated data.
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
