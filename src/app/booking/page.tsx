'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { format, subDays, add, set, getDay, startOfDay, endOfDay, isWithinInterval, parse } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { collection, serverTimestamp, doc, getDocs, query, where, Timestamp, collectionGroup } from 'firebase/firestore';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { Service, Barber, Appointment, Customer, Schedule } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

type BookingStep = 'service' | 'barber' | 'time' | 'confirm';

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [barberAppointments, setBarberAppointments] = useState<Appointment[]>([]);
  const [barberSchedules, setBarberSchedules] = useState<Schedule[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'services');
  }, [firestore]);

  const barbersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'barbers');
  }, [firestore]);

  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);
  const { data: barbers, isLoading: isLoadingBarbers } = useCollection<Barber>(barbersQuery);

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!firestore || !selectedBarber) return;
      setIsLoadingAppointments(true);
      try {
        const allAppointments: Appointment[] = [];
        const customersSnapshot = await getDocs(collection(firestore, 'customers'));
        for (const customerDoc of customersSnapshot.docs) {
          const appointmentsSnapshot = await getDocs(collection(firestore, 'customers', customerDoc.id, 'appointments'));
          appointmentsSnapshot.forEach(appointmentDoc => {
            const apptData = appointmentDoc.data() as Appointment;
            if (apptData.barberId === selectedBarber.id) {
                 allAppointments.push({ ...apptData, id: appointmentDoc.id });
            }
          });
        }
        setBarberAppointments(allAppointments);

        const schedulesQuery = query(collection(firestore, 'barbers', selectedBarber.id, 'schedules'));
        const scheduleSnapshot = await getDocs(schedulesQuery);
        const schedulesData = scheduleSnapshot.docs.map(doc => doc.data() as Schedule);
        setBarberSchedules(schedulesData);

      } catch (error) {
        console.error("Error fetching barber data: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load barber's schedule. Please try again."
        });
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchBarberData();
  }, [selectedBarber, firestore, toast]);
  

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep('time');
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setStep('confirm');
  };
  
  const handleBookingConfirm = async () => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to be signed in to book an appointment. Signing you in anonymously for now.',
      });
      if (auth) {
        await initiateAnonymousSignIn(auth);
      }
      return;
    }

    if (!selectedService || !selectedBarber || !selectedTime || !firestore) return;

    setIsBooking(true);

    const customerDocRef = doc(firestore, 'customers', user.uid);
    const appointmentCollectionRef = collection(customerDocRef, 'appointments');

    setDocumentNonBlocking(customerDocRef, {
      id: user.uid,
      email: user.email || `anon_${user.uid}@example.com`,
      name: user.displayName || 'Anonymous User',
      phone: user.phoneNumber || '',
    }, { merge: true });

    const newAppointment = {
      customerId: user.uid,
      customerName: user.displayName || 'Anonymous User',
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      startTime: selectedTime,
      endTime: add(selectedTime, { minutes: selectedService.duration }),
      status: 'Confirmed',
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(appointmentCollectionRef, newAppointment);
    
    setIsBooking(false);
    setIsConfirmed(true);
  };

  const resetBooking = () => {
    setStep('service');
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setIsConfirmed(false);
    setIsBooking(false);
  }

 const getAvailableTimes = (date: Date | undefined, schedules: Schedule[]) => {
    if (!schedules || schedules.length === 0 || !date || !selectedService) return [];
    
    const times: Date[] = [];
    const today = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    
    const dayName = format(date, 'EEEE');
    
    const barberScheduleForDay = schedules.find(slot => slot.dayOfWeek === dayName);
    
    if (!barberScheduleForDay || !barberScheduleForDay.startTime || !barberScheduleForDay.endTime) {
        return [];
    }
    
    const appointmentsForDay = barberAppointments
        .filter(appt => format((appt.startTime as Timestamp).toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        .map(appt => ({
            start: (appt.startTime as Timestamp).toDate(),
            end: (appt.endTime as Timestamp).toDate(),
        }));
    
    let slotStart = parse(barberScheduleForDay.startTime, 'HH:mm', date);
    const slotEnd = parse(barberScheduleForDay.endTime, 'HH:mm', date);

    while (slotStart < slotEnd) {
        const potentialEndTime = add(slotStart, { minutes: selectedService.duration });
        if (potentialEndTime > slotEnd) break;

        const isBooked = appointmentsForDay.some(appt => 
            (slotStart < appt.end && potentialEndTime > appt.start)
        );

        const isPast = isToday && slotStart < today;

        if (!isBooked && !isPast) {
            times.push(new Date(slotStart));
        }

        slotStart = add(slotStart, { minutes: 15 });
    }

    return times;
  }
  
  const isDateDisabled = (date: Date): boolean => {
    if (date < startOfDay(new Date())) return true;
    if (!barberSchedules || barberSchedules.length === 0 || !selectedService) return true;

    const dayName = format(date, 'EEEE');
    const scheduleForDay = barberSchedules.find(s => s.dayOfWeek === dayName);

    if (!scheduleForDay || !scheduleForDay.startTime || !scheduleForDay.endTime) {
      return true; // No schedule for this day
    }

    // Check if there are any available slots on this day
    const availableTimes = getAvailableTimes(date, barberSchedules);
    return availableTimes.length === 0;
  };


  const availableTimes = getAvailableTimes(selectedDate, barberSchedules);

  const renderStep = () => {
    switch (step) {
      case 'service':
        return (
          <>
            <h2 className="text-2xl font-bold font-headline mb-6">1. Select a Service</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingServices && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
              {services?.map((service) => (
                <Card key={service.id} className="cursor-pointer hover:border-primary transition-all group" onClick={() => handleServiceSelect(service)}>
                  <CardHeader className="p-0">
                    <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
                      <Image src={service.imageUrl} alt={service.name} data-ai-hint={service.imageHint} fill objectFit="cover" className="group-hover:scale-105 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>

                    <div className="flex justify-between items-center mt-4 font-semibold">
                      <span className="text-primary">${service.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{service.duration} min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );
      case 'barber':
        return (
          <>
            <Button variant="ghost" onClick={() => setStep('service')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Services</Button>
            <h2 className="text-2xl font-bold font-headline mb-6">2. Select a Barber</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {isLoadingBarbers && Array.from({length: 4}).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
              {barbers?.map((barber) => (
                <div key={barber.id} onClick={() => handleBarberSelect(barber)} className="cursor-pointer group flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-card transition-all">
                  <div className="relative">
                    <Image src={barber.imageUrl} alt={barber.name} data-ai-hint={barber.imageHint} width={100} height={100} className="rounded-full ring-2 ring-border group-hover:ring-primary transition-all" />
                  </div>
                  <h3 className="font-bold text-center">{barber.name}</h3>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {barber.specialties.map(s => <Badge variant="secondary" key={s}>{s}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'time':
        return (
          <>
            <Button variant="ghost" onClick={() => setStep('barber')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Barbers</Button>
            <h2 className="text-2xl font-bold font-headline mb-6">3. Select a Date &amp; Time</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Select a date:</h3>
                {isLoadingAppointments ? <Skeleton className="h-[290px] w-[320px] rounded-md" /> :
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border bg-card"
                  disabled={isDateDisabled}
                />}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Available times for <span className="text-primary">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}</span>:</h3>
                {isLoadingAppointments ? <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> :
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimes.length > 0 ? availableTimes.map((time, index) => (
                        <Button key={index} variant="outline" onClick={() => handleTimeSelect(time)}>
                            {format(time, 'h:mm a')}
                        </Button>
                    )) : <p className="text-muted-foreground col-span-full">No available times for this day. Please select another date.</p>}
                </div>}
              </div>
            </div>
          </>
        );
      case 'confirm':
        return (
          <>
            <Button variant="ghost" onClick={() => setStep('time')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Time Selection</Button>
            <h2 className="text-2xl font-bold font-headline mb-6">4. Confirm Your Booking</h2>
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Appointment Summary</CardTitle>
                <CardDescription>Please review the details below before confirming.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barber:</span>
                  <span className="font-semibold">{selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-semibold">{selectedTime ? format(selectedTime, 'MMMM d, yyyy') : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-semibold">{selectedTime ? format(selectedTime, 'h:mm a') : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">${selectedService?.price.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleBookingConfirm} disabled={isBooking || isUserLoading}>
                  {isBooking ? 'Booking...' : 'Confirm Booking'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-card p-6 md:p-10 rounded-lg shadow-sm">
            {renderStep()}
          </div>
        </div>
      </main>
      <Footer />
      <AlertDialog open={isConfirmed} onOpenChange={setIsConfirmed}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <AlertDialogTitle className="text-center text-2xl">Appointment Confirmed!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your appointment for a {selectedService?.name} with {selectedBarber?.name} on {selectedTime && format(selectedTime, "EEEE, MMMM d 'at' h:mm a")} has been successfully booked.
              <br />
              A confirmation has been sent to your email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={resetBooking} className="w-full">Book Another Appointment</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
