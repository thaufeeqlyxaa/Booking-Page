export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  focus: string;
  price: number;
};

export const services: Service[] = [
  {
    id: 'wellness-body',
    name: 'Holistic Wellness',
    description: 'Root-cause review with wellness plans tuned to your rhythms.',
    duration: '30 min',
    focus: 'Lifestyle + Nutrition',
    price: 1200
  },
  {
    id: 'movement-care',
    name: 'Movement & Recovery',
    description: 'Movement analysis, musculoskeletal cadence, and recovery cues.',
    duration: '40 min',
    focus: 'Mobility + Recovery',
    price: 1400
  },
  {
    id: 'mindful-clarity',
    name: 'Mindful Clarity',
    description: 'Calm, high-trust space to explore stress, resilient habits, and clarity.',
    duration: '35 min',
    focus: 'Stress + Resilience',
    price: 1000
  }
];
