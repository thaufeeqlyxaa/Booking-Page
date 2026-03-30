import emailjs from '@emailjs/browser';

export type BookingPayload = {
  service: string;
  doctor: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  notes?: string;
};

export type BookingSendResult = {
  mode: 'emailjs' | 'formsubmit' | 'mailto';
};

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const RECIPIENT_EMAIL = process.env.NEXT_PUBLIC_BOOKING_RECIPIENT_EMAIL || 'thaufeeq.lyxaa@gmail.com';

function buildTemplateParams(payload: BookingPayload) {
  return {
    to_email: RECIPIENT_EMAIL,
    service: payload.service,
    doctor: payload.doctor,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    age: payload.age,
    notes: payload.notes || 'None provided'
  };
}

function buildMailtoUrl(payload: BookingPayload) {
  const subject = encodeURIComponent(`New booking request: ${payload.doctor} / ${payload.service}`);
  const body = encodeURIComponent(
    [
      `Service: ${payload.service}`,
      `Doctor: ${payload.doctor}`,
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Age: ${payload.age}`,
      `Notes: ${payload.notes || 'None provided'}`
    ].join('\n')
  );

  return `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
}

async function sendWithFormSubmit(payload: BookingPayload) {
  const response = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      _subject: `New booking request: ${payload.doctor} / ${payload.service}`,
      _template: 'table',
      _captcha: 'false',
      ...buildTemplateParams(payload)
    })
  });

  if (!response.ok) {
    throw new Error('Form submission failed.');
  }

  return response.json();
}

export async function sendBookingEmail(payload: BookingPayload): Promise<BookingSendResult> {
  if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY) {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, buildTemplateParams(payload), PUBLIC_KEY);
    return { mode: 'emailjs' };
  }

  try {
    await sendWithFormSubmit(payload);
    return { mode: 'formsubmit' };
  } catch {
    if (typeof window !== 'undefined') {
      window.location.href = buildMailtoUrl(payload);
    }

    return { mode: 'mailto' };
  }
}
