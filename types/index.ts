export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  experience?: string;
  bio?: string;
  image_url?: string;
  image?: string; // Support for components still using .image
  price?: number;
  created_at?: string;
  slot?: string;
  topics?: string[];
  hours?: string;
  languages?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: number;
  created_at?: string;
}

export interface Booking {
  id: string;
  doctor_id?: string;
  service_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  age?: string;
  notes?: string;
  created_at?: string;
}
