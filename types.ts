import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

export enum ProductCategory {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Snacks = 'snacks',
  Beverages = 'beverages'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  calories?: number;
  fitnessGoal?: 'muscle_gain' | 'weight_loss';
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface TimeSlot {
  id: string; // ISO string of slot start time
  startTime: Timestamp;
  maxOrders: number;
  currentOrders: number;
  status: 'available' | 'full' | 'closed';
}

export enum OrderStatus {
  PENDING = 'PENDING', // Waiting for admin verification
  CONFIRMED = 'CONFIRMED', // Admin verified payment
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string;
  customerMobile: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  scheduledTime: Timestamp; // The start time of the slot
  slotId: string;
  transactionId: string; // UPI UTR or Transaction ID
  createdAt: Timestamp;
}