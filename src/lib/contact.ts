export const CONTACT_EMAIL = 'ian_warutere@gartsafrica.com';

/** E.164 without + — used for wa.me links */
export const WHATSAPP_NUMBER = '254114904624';

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hi, I would like to learn more about DIMES-BI.';

export function whatsappUrl(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
