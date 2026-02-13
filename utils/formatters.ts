import { Timestamp } from 'firebase/firestore';
import { CURRENCY_SYMBOL } from '../constants';

export const formatPrice = (price: number): string => {
  return `${CURRENCY_SYMBOL}${price.toFixed(2)}`;
};

export const formatTime = (timestamp: Timestamp | Date): string => {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp: Timestamp | Date): string => {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

export const generateTimeSlots = (): Date[] => {
  const slots: Date[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0); // Round up to next 15 min

  // Generate for next 24 hours
  for (let i = 0; i < 24 * 4; i++) {
    const slotTime = new Date(start.getTime() + i * 15 * 60000);
    const hour = slotTime.getHours();
    // Only business hours
    if (hour >= 8 && hour < 20) {
      slots.push(slotTime);
    }
  }
  return slots;
};
