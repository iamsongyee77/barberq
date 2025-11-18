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
import type { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerEditor } from '@/components/admin/customer-editor';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';


export default function CustomersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { customers, isLoading, refetchData } = useAdminData();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditorOpen(true);
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (!selectedCustomer || !firestore) return;
    try {
        const customerRef = doc(firestore, 'customers', selectedCustomer.id);
        await writeBatch(firestore).delete(customerRef).commit();
        toast({
            title: "Customer Deleted",
            description: `${selectedCustomer.name} has been removed from the system.`,
        });
      refetchData();
    } catch (error) {
        console.error("Failed to delete customer:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting the customer.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedCustomer(null);
    }
  }

  const handleCloseDialog = () => {
    setIsEditorOpen(false);
    setSelectedCustomer(null);
    refetchData();
  }

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage all customers in the system.</CardDescription>
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
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && customers.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                          No customers found.
                      </TableCell>
                  </TableRow>
              )}
              {!isLoading &&
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar>
                            <AvatarImage src={`https://avatar.vercel.sh/${customer.id}.png`} alt={customer.name} />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                        <div>{customer.email}</div>
                        <div className="text-muted-foreground text-sm">{customer.phone || ''}</div>
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
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCustomer(customer)}>
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

      <CustomerEditor
          customer={selectedCustomer}
          isOpen={isEditorOpen}
          onOpenChange={handleCloseDialog}
        />
     

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selectedCustomer?.name}'s account and all associated data.
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
