'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Doctor } from '@/data/doctors';

const doctorVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 }
};

type DoctorCardProps = {
  doctor: Doctor;
  selected: boolean;
  onSelect: (doctor: Doctor) => void;
};

export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  return (
    <motion.button
      type="button"
      layout
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={doctorVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(doctor)}
      className={`section-card p-5 text-left border border-transparent shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sage transition-all ${
        selected ? 'border-sage shadow-soft-lg' : 'hover:shadow-soft-lg'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-[22px] border border-ink/10">
          <Image src={doctor.image} alt={doctor.name} fill sizes="80px" className="object-cover" priority />
        </div>
        <div>
          <p className="text-base font-semibold text-ink">{doctor.name}</p>
          <p className="text-sm text-ink/70">{doctor.specialty}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-mist">{doctor.experience}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-mist">{selected ? 'Selected doctor' : 'Tap to select'}</p>
        <p className="text-sm text-ink/55">Profile</p>
      </div>
    </motion.button>
  );
}
