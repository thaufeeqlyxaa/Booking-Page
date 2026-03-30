export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  image: string;
  hours: string;
  topics: string[];
  slot: string;
  price: number;
};

export const doctors: Doctor[] = [
  {
    id: 'andrea-cole',
    name: 'Dr. Andrea Cole',
    specialty: 'Consultant Psychologist',
    experience: '12 yrs experience',
    bio: 'Calm, structured sessions for emotional resilience, transitions, and relationship clarity.',
    image: '/images/doctors/doctor-1.svg',
    hours: '5000+ therapy hours',
    topics: ['Life transitions', 'Stress', 'Relationship concerns'],
    slot: 'Today, 1:00 PM',
    price: 1500
  },
  {
    id: 'simon-lee',
    name: 'Dr. Simon Lee',
    specialty: 'Consultant Psychologist',
    experience: '10 yrs experience',
    bio: 'Focused on anxiety recovery, emotional regulation, and confidence-building sessions.',
    image: '/images/doctors/doctor-2.svg',
    hours: '2500+ therapy hours',
    topics: ['Anxiety', 'Burnout', 'Anger management'],
    slot: 'Today, 2:15 PM',
    price: 1200
  },
  {
    id: 'maya-pratt',
    name: 'Dr. Maya Pratt',
    specialty: 'Consultant Psychologist',
    experience: '8 yrs experience',
    bio: 'Blends supportive talk therapy with practical strategies for everyday mental wellness.',
    image: '/images/doctors/doctor-3.svg',
    hours: '2500+ therapy hours',
    topics: ['Trauma', 'Motivation', 'Self-esteem'],
    slot: 'Today, 3:00 PM',
    price: 1000
  },
  {
    id: 'sameeha-salim',
    name: 'Dr. Sameeha Salim',
    specialty: 'Consultant Psychologist',
    experience: '9 yrs experience',
    bio: 'Works gently with self-esteem, emotional conflicts, and life direction challenges.',
    image: '/images/doctors/doctor-2.svg',
    hours: '3000+ therapy hours',
    topics: ['Self-esteem', 'Emotional conflicts', 'Life direction'],
    slot: 'Today, 3:30 PM',
    price: 1000
  },
  {
    id: 'angelin-akkara',
    name: 'Dr. Angeline Akkara',
    specialty: 'Consultant Psychologist',
    experience: '11 yrs experience',
    bio: 'A grounded therapist for adjustment issues, work stress, and emotional overwhelm.',
    image: '/images/doctors/doctor-1.svg',
    hours: '1500+ therapy hours',
    topics: ['Adjustment', 'Work stress', 'Emotional regulation'],
    slot: 'Today, 4:00 PM',
    price: 1000
  },
  {
    id: 'archana-iyer',
    name: 'Dr. Archana Iyer',
    specialty: 'Consultant Psychologist',
    experience: '7 yrs experience',
    bio: 'Supports clients with structured care around learning challenges, stress, and focus.',
    image: '/images/doctors/doctor-3.svg',
    hours: '2500+ therapy hours',
    topics: ['Stress', 'Focus', 'Neurodivergent support'],
    slot: 'Today, 5:00 PM',
    price: 1000
  }
];
