import type { Timestamp } from "firebase/firestore";

export const ADMIN_EMAILS = ["admin@example.com"];

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  imageUrl: string;
  imageHint: string;
};

export type Schedule = {
  id: string;
  barberId: string;
  dayOfWeek: string;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
}

export type Barber = {
  id: string;
  name: string;
  specialties: string[];
  imageUrl: string;
  imageHint: string;
  schedules?: Omit<Schedule, 'barberId' | 'id'>[]; // For initial seeding, remove barberId and id
};

export type Appointment = {
  id:string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date | Timestamp;
  endTime: Date | Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt?: Timestamp;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentHistory?: Appointment[];
  preferences?: {
    preferredBarberIds?: string[];
    availability?: {
      startTime: string; // ISO string
      endTime: string; // ISO string
    }[];
  };
};

export type PageContent = {
  id: string;
  shopName: string;
  heroHeadline: string;
  heroSubheadline: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  servicesTitle: string;
  barbersTitle: string;
};
