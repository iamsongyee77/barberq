export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  imageUrl: string;
  imageHint: string;
};

export type Barber = {
  id: string;
  name: string;
  specialties: string[];
  imageUrl: string;
  imageHint: string;
  availability: {
    startTime: string; // ISO string
    endTime: string; // ISO string
  }[];
};

export type Appointment = {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentHistory: Appointment[];
  preferences: {
    preferredBarberIds?: string[];
    availability?: {
      startTime: string; // ISO string
      endTime: string; // ISO string
    }[];
  };
};
