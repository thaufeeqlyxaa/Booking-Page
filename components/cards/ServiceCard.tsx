'use client';

import { motion } from 'framer-motion';
import { type Service } from '@/lib/supabase';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

type ServiceCardProps = {
  service: Service;
  selected: boolean;
  onSelect: (service: Service) => void;
};

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <motion.button
      type="button"
      layout
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={cardVariants}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(service)}
      className={`section-card w-full p-5 text-left transition-all border border-transparent shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
        selected ? 'border-sage shadow-soft-lg' : 'hover:shadow-soft-lg'
      }`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-mist">
        <span>{service.duration}</span>
        <span>{selected ? 'Selected' : 'Choose'}</span>
      </div>
      <p className="mt-5 text-lg font-semibold text-ink">{service.name}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">{service.description}</p>
    </motion.button>
  );
}
