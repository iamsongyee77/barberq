'use client';

import React, { useState, useMemo } from 'react';
import { MoreHorizontal, PlusCircle, Check, X as XIcon, Loader2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { doc, writeBatch } from 'firebase/firestore';

type User = (Customer | Barber) & { role: 'Customer' | 'Barber' };

export default function UsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { customers, barbers, isLoading, refetchData } = useAdminData();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // State for inline role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<'Customer' | 'Barber' | null>(null);
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);

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
        const customerRef = doc(firestore, 'customers', selectedUser.id);
        await writeBatch(firestore).delete(customerRef).commit();
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

  const handleRoleEditStart = (user: User) => {
    setEditingRoleId(user.id);
    setPendingRole(user.role);
  };

  const handleRoleEditCancel = () => {
    setEditingRoleId(null);
    setPendingRole(null);
  };

  const handleRoleChangeConfirm = async (userToUpdate: User) => {
    if (!firestore || !pendingRole || userToUpdate.role === pendingRole) {
      handleRoleEditCancel();
      return;
    }
    setIsRoleChanging(userToUpdate.id);

    try {
      const batch = writeBatch(firestore);

      if (userToUpdate.role === 'Customer' && pendingRole === 'Barber') {
        // Customer -> Barber
        const oldRef = doc(firestore, 'customers', userToUpdate.id);
        const newRef = doc(firestore, 'barbers', userToUpdate.id);
        
        batch.delete(oldRef);
        batch.set(newRef, {
            id: userToUpdate.id,
            name: userToUpdate.name,
            email: userToUpdate.email, // Barbers also have emails in our type
            specialties: ['New Barber'],
            imageUrl: `https://avatar.vercel.sh/${userToUpdate.id}.png`,
            imageHint: 'portrait',
        });

      } else if (userToUpdate.role === 'Barber' && pendingRole === 'Customer') {
        // Barber -> Customer
        const oldRef = doc(firestore, 'barbers', userToUpdate.id);
        const newRef = doc(firestore, 'customers', userToUpdate.id);
        
        batch.delete(oldRef);
        batch.set(newRef, {
          id: userToUpdate.id,
          name: userToUpdate.name,
          email: userToUpdate.email,
          phone: (userToUpdate as Customer).phone || ''
        });
      }
      
      await batch.commit();
      toast({
        title: "Role Updated",
        description: `${userToUpdate.name}'s role has been changed to ${pendingRole}.`,
      });
      refetchData();
    } catch (error) {
      console.error("Failed to change user role:", error);
      toast({
        variant: "destructive",
        title: "Role Change Failed",
        description: "An error occurred while updating the user's role.",
      });
    } finally {
      setIsRoleChanging(null);
      handleRoleEditCancel();
    }
  };

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
                      {editingRoleId === user.id ? (
                        <div className="flex items-center gap-2">
                           {isRoleChanging === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                            <>
                              <Select value={pendingRole ?? user.role} onValueChange={(value: 'Customer' | 'Barber') => setPendingRole(value)}>
                                <SelectTrigger className="h-8 w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Customer">Customer</SelectItem>
                                  <SelectItem value="Barber">Barber</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRoleChangeConfirm(user)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRoleEditCancel}>
                                <XIcon className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                           )}
                        </div>
                      ) : (
                        <Badge 
                          variant={user.role === 'Barber' ? 'secondary' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleRoleEditStart(user)}
                        >
                          {user.role}
                        </Badge>
                      )}
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
