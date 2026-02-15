import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  runTransaction, 
  query, 
  where, 
  Timestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Order, OrderStatus, TimeSlot, ProductCategory } from '../types';
import { MAX_ORDERS_PER_SLOT } from '../constants';

// Mock data for fallback when Firestore permissions are missing
export const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: 'mock1', name: 'Avocado Toast (Demo)', description: 'Sourdough, smashed avocado, chili flakes. Setup Firestore to see real data.', price: 12, category: ProductCategory.Breakfast, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80' },
  { id: 'mock2', name: 'Truffle Burger (Demo)', description: 'Angus beef, truffle mayo, brioche bun.', price: 18, category: ProductCategory.Lunch, preparationTime: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { id: 'mock3', name: 'Quinoa Salad (Demo)', description: 'Kale, quinoa, cherry tomatoes, lemon vinaigrette.', price: 14, category: ProductCategory.Lunch, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
  { id: 'mock4', name: 'Espresso (Demo)', description: 'Double shot single origin.', price: 3.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
  { id: 'mock5', name: 'Matcha Latte (Demo)', description: 'Ceremonial grade matcha, oat milk.', price: 5.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=800&q=80' },
  { id: 'mock6', name: 'Acai Bowl (Demo)', description: 'Organic acai, granola, fresh berries.', price: 15, category: ProductCategory.Breakfast, preparationTime: 12, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80' },
];

// --- MENU ---
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, 'menuItems'), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    
    // If we have data, return it
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
    }
    
    return [];
  } catch (error: any) {
    console.warn("Firestore access failed (likely permissions), returning mock data.");
    // Return mock data so the app looks functional during setup
    return MOCK_MENU_ITEMS;
  }
};

export const getAllMenuItemsAdmin = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, 'menuItems'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
  } catch (error) {
    console.error("Admin menu fetch failed", error);
    return [];
  }
};

export const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  return addDoc(collection(db, 'menuItems'), item);
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
  return updateDoc(doc(db, 'menuItems', id), data);
};

// --- SLOTS & ORDERS ---

// Ensure a slot document exists
export const ensureSlotExists = async (slotId: string, startTime: Date) => {
  try {
    const slotRef = doc(db, 'timeSlots', slotId);
    await setDoc(slotRef, {
      id: slotId,
      startTime: Timestamp.fromDate(startTime),
      maxOrders: MAX_ORDERS_PER_SLOT,
    }, { merge: true });
  } catch (e) {
    console.error("Failed to ensure slot exists", e);
  }
};

export const createOrder = async (
  userId: string, 
  userEmail: string, 
  items: MenuItem[], 
  quantities: Record<string, number>,
  slotId: string,
  slotDate: Date,
  transactionId: string,
  customerName: string,
  customerMobile: string
): Promise<string> => {
  
  const totalAmount = items.reduce((sum, item) => sum + (item.price * quantities[item.id]), 0);
  const orderItems = items.map(item => ({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: quantities[item.id]
  }));

  try {
    const orderId = await runTransaction(db, async (transaction) => {
      const slotRef = doc(db, 'timeSlots', slotId);
      const slotDoc = await transaction.get(slotRef);

      let currentOrders = 0;
      let maxOrders = MAX_ORDERS_PER_SLOT;
      let status = 'available';

      if (slotDoc.exists()) {
        const slotData = slotDoc.data() as TimeSlot;
        currentOrders = slotData.currentOrders || 0;
        maxOrders = slotData.maxOrders;
        status = slotData.status;
      }

      if (status !== 'available' || currentOrders >= maxOrders) {
        throw new Error("SLOT_FULL");
      }

      // Create or Update Slot
      transaction.set(slotRef, {
        id: slotId,
        startTime: Timestamp.fromDate(slotDate),
        maxOrders,
        currentOrders: currentOrders + 1,
        status: (currentOrders + 1 >= maxOrders) ? 'full' : 'available'
      }, { merge: true });

      // Create Order
      const newOrderRef = doc(collection(db, 'orders'));
      const newOrder: Omit<Order, 'id'> = {
        userId,
        userEmail,
        customerName,
        customerMobile,
        items: orderItems,
        totalAmount,
        status: OrderStatus.PENDING, 
        scheduledTime: Timestamp.fromDate(slotDate),
        slotId,
        transactionId,
        createdAt: Timestamp.now()
      };
      
      transaction.set(newOrderRef, newOrder);
      return newOrderRef.id;
    });
    return orderId;
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw e;
  }
};

// --- USER ORDERS ---
export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, 'orders'), 
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    orders.sort((a, b) => {
       const tA = a.createdAt?.toMillis() || 0;
       const tB = b.createdAt?.toMillis() || 0;
       return tB - tA; // Descending
    });
    callback(orders);
  }, (error) => {
    console.error("Order subscription failed", error);
    callback([]);
  });
};

// --- ADMIN ---
export const subscribeToAllOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(db, 'orders'));
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    orders.sort((a, b) => {
       const tA = a.createdAt?.toMillis() || 0;
       const tB = b.createdAt?.toMillis() || 0;
       return tB - tA; // Descending
    });
    callback(orders);
  }, (error) => {
    console.error("Admin subscription failed", error);
    callback([]);
  });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  return updateDoc(doc(db, 'orders', orderId), { status });
};

export const seedMenu = async () => {
  const items = [
    { name: 'Avocado Toast', description: 'Sourdough, smashed avocado, chili flakes', price: 12, category: ProductCategory.Breakfast, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Truffle Burger', description: 'Angus beef, truffle mayo, brioche bun', price: 18, category: ProductCategory.Lunch, preparationTime: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Quinoa Salad', description: 'Kale, quinoa, cherry tomatoes, lemon vinaigrette', price: 14, category: ProductCategory.Lunch, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Espresso', description: 'Double shot single origin', price: 3.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Matcha Latte', description: 'Ceremonial grade matcha, oat milk', price: 5.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=800&q=80' },
    { name: 'Acai Bowl', description: 'Organic acai, granola, fresh berries', price: 15, category: ProductCategory.Breakfast, preparationTime: 12, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80' },
  ];
  
  try {
    for (const item of items) {
      await addDoc(collection(db, 'menuItems'), item);
    }
  } catch (e) {
    console.warn("Seeding failed (permission denied). This is expected in Demo mode.");
    throw e;
  }
};