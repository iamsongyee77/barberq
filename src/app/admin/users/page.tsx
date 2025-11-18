'use client';

import React, { useState, useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerEditor } from '@/components/admin/customer-editor';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, deleteDoc } from 'firebase/firestore';
import type { Customer, Barber } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { BarberEditor } from '@/components/admin/barber-editor';


type SystemUser = (Customer | Barber) & { role: 'Customer' | 'Barber' };

export default function UsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { customers, barbers, isLoading, refetchData } = useAdminData();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const allUsers = useMemo<SystemUser[]>(() => {
    if (isLoading) return [];
    const customerUsers: SystemUser[] = customers.map(c => ({...c, role: 'Customer'}));
    const barberUsers: SystemUser[] = barbers.map(b => ({...b, role: 'Barber'}));
    return [...customerUsers, ...barberUsers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, barbers, isLoading]);
  
  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsEditorOpen(true);
  }

  const handleDeleteUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (!selectedUser || !firestore) return;
    try {
        const collectionName = selectedUser.role === 'Barber' ? 'barbers' : 'customers';
        const userRef = doc(firestore, collectionName, selectedUser.id);
        await deleteDoc(userRef);
        toast({
            title: "User Deleted",
            description: `${selectedUser.name} has been removed from the system.`,
        });
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

  const renderEditor = () => {
    if (!selectedUser) return null;
    if (selectedUser.role === 'Barber') {
      return (
        <BarberEditor
          barber={selectedUser as Barber}
          isOpen={isEditorOpen}
          onOpenChange={handleCloseDialog}
        />
      );
    }
    return (
       <CustomerEditor
          customer={selectedUser as Customer}
          isOpen={isEditorOpen}
          onOpenChange={handleCloseDialog}
        />
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage all users in the system, including customers and barbers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && allUsers.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                      </TableCell>
                  </TableRow>
              )}
              {!isLoading &&
                allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar>
                            <AvatarImage src={user.imageUrl || `https://avatar.vercel.sh/${user.id}.png`} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                        <div>{user.email}</div>
                        <div className="text-muted-foreground text-sm">{user.phone || ''}</div>
                    </TableCell>
                     <TableCell>
                        <Badge variant={user.role === 'Barber' ? 'default' : 'secondary'}>
                            {user.role}
                        </Badge>
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

      {renderEditor()}
     

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
