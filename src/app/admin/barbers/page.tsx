'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Barber } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ScheduleEditor } from '@/components/admin/schedule-editor';

export default function BarbersPage() {
  const firestore = useFirestore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const barbersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'barbers'), orderBy('name'));
  }, [firestore]);

  const { data: barbers, isLoading } = useCollection<Barber>(barbersQuery);
  
  const handleViewSchedule = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsEditorOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Barbers</CardTitle>
          <CardDescription>Manage your team of barbers.</CardDescription>
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
                          No barbers found. Have you seeded the database?
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
                        src={barber.imageUrl}
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewSchedule(barber)}>View Schedule</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
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
      
      {selectedBarber && (
        <ScheduleEditor 
          barber={selectedBarber}
          isOpen={isEditorOpen}
          onOpenChange={setIsEditorOpen}
        />
      )}
    </>
  );
}
