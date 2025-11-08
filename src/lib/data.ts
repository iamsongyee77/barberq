import type { Service, Barber, Appointment, Customer } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { addHours, subDays } from "date-fns";

const findImage = (id: string) => {
  const img = placeholderImages.find(p => p.id === id);
  return {
    url: img?.imageUrl || `https://picsum.photos/seed/${id}/400/400`,
    hint: img?.imageHint || "placeholder"
  };
};

export const services: Service[] = [
  { id: 's1', name: 'Classic Haircut', description: 'A timeless cut, tailored to your style.', price: 40, duration: 45, imageUrl: findImage('service1').url, imageHint: findImage('service1').hint },
  { id: 's2', name: 'Beard Trim', description: 'Shape and refine your beard to perfection.', price: 25, duration: 30, imageUrl: findImage('service2').url, imageHint: findImage('service2').hint },
  { id: 's3', name: 'Hot Towel Shave', description: 'A luxurious and close shave experience.', price: 45, duration: 45, imageUrl: findImage('service3').url, imageHint: findImage('service3').hint },
  { id: 's4', name: "Kid's Cut", description: 'A great haircut for our younger clients (under 12).', price: 30, duration: 30, imageUrl: findImage('service4').url, imageHint: findImage('service4').hint },
  { id: 's5', name: 'Hair Coloring', description: 'Full-head professional hair coloring service.', price: 80, duration: 90, imageUrl: findImage('service5').url, imageHint: findImage('service5').hint },
];

const today = new Date();
// This is now just default data for initial seeding. The real schedule will be in the 'schedules' sub-collection.
const defaultSchedules = [
    { dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 'Friday', startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 'Saturday', startTime: '08:00', endTime: '16:00' },
    { dayOfWeek: 'Sunday', startTime: '', endTime: '' }, // Day off
];


export const barbers: Barber[] = [
  { id: 'b1', name: 'Alex Johnson', specialties: ['Fades', 'Classic Cuts'], imageUrl: findImage('barber1').url, imageHint: findImage('barber1').hint, schedules: defaultSchedules },
  { id: 'b2', name: 'Ben Carter', specialties: ['Beards', 'Shaves'], imageUrl: findImage('barber2').url, imageHint: findImage('barber2').hint, schedules: defaultSchedules },
  { id: 'b3', name: 'Chloe Davis', specialties: ['Long Hair', 'Coloring'], imageUrl: findImage('barber3').url, imageHint: findImage('barber3').hint, schedules: defaultSchedules },
  { id: 'b4', name: 'David Rodriguez', specialties: ["Kid's Cuts", 'Modern Styles'], imageUrl: findImage('barber4').url, imageHint: findImage('barber4').hint, schedules: defaultSchedules },
];

export const appointments: Appointment[] = [
  { id: 'a1', customerId: 'c1', customerName: 'John Doe', barberId: 'b1', barberName: 'Alex Johnson', serviceId: 's1', serviceName: 'Classic Haircut', startTime: addHours(subDays(new Date(), 1), 10), endTime: addHours(subDays(new Date(), 1), 10.75), status: 'Completed' },
  { id: 'a2', customerId: 'c2', customerName: 'Jane Smith', barberId: 'b2', barberName: 'Ben Carter', serviceId: 's2', serviceName: 'Beard Trim', startTime: addHours(subDays(new Date(), 1), 11), endTime: addHours(subDays(new Date(), 1), 11.5), status: 'Completed' },
  { id: 'a3', customerId: 'c1', customerName: 'John Doe', barberId: 'b1', barberName: 'Alex Johnson', serviceId: 's1', serviceName: 'Classic Haircut', startTime: addHours(new Date(), 2), endTime: addHours(new Date(), 2.75), status: 'Confirmed' },
  { id: 'a4', customerId: 'c3', customerName: 'Emily White', barberId: 'b3', barberName: 'Chloe Davis', serviceId: 's5', serviceName: 'Hair Coloring', startTime: addHours(new Date(), 3), endTime: addHours(new Date(), 4.5), status: 'Confirmed' },
];

// Mock customer data, this will be replaced by Firestore data
export const customers: Customer[] = [];
