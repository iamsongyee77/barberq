"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { ServiceEditor } from "@/components/admin/service-editor";
import { deleteService } from "@/lib/service-actions";
import { useToast } from "@/hooks/use-toast";


export default function ServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'));
  }, [firestore]);

  const { data: services, isLoading, refetch: refetchServices } = useCollection<Service>(servicesQuery);

  const handleEditService = (service: Service | null) => {
    // Create a clean copy to avoid circular references from Firestore
    const cleanService = service ? {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      imageUrl: service.imageUrl,
      imageHint: service.imageHint,
    } : null;
    setSelectedService(cleanService);
    setIsEditorOpen(true);
  }

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  }
  
  const confirmDelete = async () => {
    if (!firestore || !selectedService) return;
    try {
        await deleteService(firestore, selectedService.id);
        toast({
            title: "Service Deleted",
            description: `${selectedService.name} has been removed.`,
        });
        refetchServices();
    } catch (error) {
        console.error("Failed to delete service:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting the service.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedService(null);
    }
  }
  
  const handleCloseDialog = (isOpen: boolean) => {
    setIsEditorOpen(isOpen);
    if (!isOpen) {
      setSelectedService(null);
      refetchServices();
    }
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Services</CardTitle>
            <CardDescription>Manage the services offered at your shop.</CardDescription>
          </div>
           <Button onClick={() => handleEditService(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
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
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 5}).map((_, i) => (
               <TableRow key={i}>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-64" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
              </TableRow>
            ))}
             {!isLoading && services?.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No services found. Click "Add Service" to get started.
                      </TableCell>
                  </TableRow>
              )}
            {!isLoading && services?.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt={service.name}
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={service.imageUrl}
                    data-ai-hint={service.imageHint}
                    width="64"
                  />
                </TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-sm truncate">{service.description}</TableCell>
                <TableCell>฿{service.price.toFixed(2)}</TableCell>
                <TableCell>{service.duration} min</TableCell>
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
                      <DropdownMenuItem onClick={() => handleEditService(service)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteService(service)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <ServiceEditor 
        service={selectedService}
        isOpen={isEditorOpen}
        onOpenChange={handleCloseDialog}
      />

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the service '{selectedService?.name}'.
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
