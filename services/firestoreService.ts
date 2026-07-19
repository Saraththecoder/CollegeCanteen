import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  runTransaction, 
  query, 
  where, 
  Timestamp,
  onSnapshot,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Order, OrderStatus, TimeSlot, ProductCategory, UserProfile } from '../types';
import { MAX_ORDERS_PER_SLOT } from '../constants';

// Mock data for fallback when Firestore permissions are missing
export const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: 'mock1', name: 'Avocado Toast', description: 'Sourdough, smashed avocado, chili flakes.', price: 12, category: ProductCategory.Breakfast, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80', isVegetarian: true, isSpicy: true },
  { id: 'mock2', name: 'Truffle Burger', description: 'Angus beef, truffle mayo, brioche bun.', price: 18, category: ProductCategory.Lunch, preparationTime: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', isVegetarian: false },
  { id: 'mock3', name: 'Quinoa Salad', description: 'Kale, quinoa, cherry tomatoes, lemon vinaigrette.', price: 14, category: ProductCategory.Lunch, preparationTime: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', isVegetarian: true },
  { id: 'mock4', name: 'Espresso', description: 'Double shot single origin.', price: 3.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', isVegetarian: true },
  { id: 'mock5', name: 'Matcha Latte', description: 'Ceremonial grade matcha, oat milk.', price: 5.5, category: ProductCategory.Beverages, preparationTime: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=800&q=80', isVegetarian: true },
  { id: 'mock6', name: 'Acai Bowl', description: 'Organic acai, granola, fresh berries.', price: 15, category: ProductCategory.Breakfast, preparationTime: 12, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80', isVegetarian: true },
];

// --- SETTINGS ---

export const getStoreSettings = async (): Promise<boolean> => {
  const docRef = doc(db, 'settings', 'general');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.isStoreOpen !== undefined ? data.isStoreOpen : true;
    }
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
      console.warn("Store settings fetch warning:", error.code);
    }
  }
  return true; // Default to open
};

export const updateStoreStatus = async (isOpen: boolean) => {
  const docRef = doc(db, 'settings', 'general');
  return setDoc(docRef, { isStoreOpen: isOpen }, { merge: true });
};

// --- MENU ---
let cachedMenuItems: MenuItem[] | null = null;
let lastMenuFetchTime: number = 0;
const MENU_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getMenuItems = async (forceRefresh = false): Promise<MenuItem[]> => {
  const now = Date.now();
  if (!forceRefresh && cachedMenuItems && (now - lastMenuFetchTime) < MENU_CACHE_TTL_MS) {
    return cachedMenuItems;
  }

  try {
    const q = query(collection(db, 'menuItems'), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const items = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      cachedMenuItems = items;
      lastMenuFetchTime = now;
      return items;
    }
    
    return [];
  } catch (error: any) {
    console.warn("Firestore access failed, returning mock data.");
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

export const deleteMenuItem = async (id: string) => {
  return deleteDoc(doc(db, 'menuItems', id));
};

// --- FAVORITES ---
export const getUserFavorites = async (userId: string): Promise<string[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().favorites || [];
    }
    return [];
  } catch (e) {
    console.error("Error fetching favorites", e);
    return [];
  }
};

export const toggleFavorite = async (userId: string, itemId: string, isCurrentlyFavorite: boolean) => {
  const userRef = doc(db, 'users', userId);
  if (isCurrentlyFavorite) {
    await updateDoc(userRef, {
      favorites: arrayRemove(itemId)
    });
  } else {
    await updateDoc(userRef, {
      favorites: arrayUnion(itemId)
    });
  }
};

// --- SLOTS & ORDERS ---

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

  if (totalAmount <= 0) throw new Error("Order amount must be positive");
  if (items.length === 0) throw new Error("Order must contain items");
  if (slotDate < new Date(Date.now() - 5 * 60 * 1000)) throw new Error("Cannot book past time slots");

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

      transaction.set(slotRef, {
        id: slotId,
        startTime: Timestamp.fromDate(slotDate),
        maxOrders,
        currentOrders: currentOrders + 1,
        status: (currentOrders + 1 >= maxOrders) ? 'full' : 'available'
      }, { merge: true });

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
        createdAt: Timestamp.now(),
        expireAt: Timestamp.fromMillis(Date.now() + 180 * 24 * 60 * 60 * 1000)
      };
      
      transaction.set(newOrderRef, newOrder);

      // --- Rate Limiting: Update user's lastOrderTime ---
      const userRef = doc(db, 'users', userId);
      transaction.update(userRef, {
        lastOrderTime: serverTimestamp()
      });

      return newOrderRef.id;
    });
    return orderId;
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw e;
  }
};

// --- USER ORDERS ---
export const subscribeToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  return onSnapshot(doc(db, 'orders', orderId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() } as Order);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Order doc subscription failed", error);
    callback(null);
  });
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, 'orders'), 
    where('userId', '==', userId)
  );
  
  try {
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    orders.sort((a, b) => {
       const tA = a.createdAt?.toMillis() || 0;
       const tB = b.createdAt?.toMillis() || 0;
       return tB - tA;
    });
    return orders;
  } catch (error) {
    console.error("Order fetch failed", error);
    return [];
  }
};

// --- USER VERIFICATION ---
export const getUnverifiedUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('verified', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const verifyUserAccount = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { verified: true });
};

// --- ADMIN ---
export const subscribeToActiveOrders = (callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, 'orders'),
    where('status', 'in', [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY])
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    orders.sort((a, b) => {
       const tA = a.createdAt?.toMillis() || 0;
       const tB = b.createdAt?.toMillis() || 0;
       return tB - tA;
    });
    callback(orders);
  }, (error) => {
    console.error("Admin active orders subscription failed", error);
    callback([]);
  });
};

export const getPaginatedOrders = async (
  dateRange: 'today' | 'week' | 'all',
  lastDoc: any = null
): Promise<{ orders: Order[], lastVisible: any }> => {
  let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  
  if (dateRange === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(startOfDay)));
  } else if (dateRange === 'week') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(startOfWeek)));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  try {
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { orders, lastVisible };
  } catch (error) {
    console.error("Paginated orders fetch failed", error);
    return { orders: [], lastVisible: null };
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  return updateDoc(doc(db, 'orders', orderId), { status });
};

export const seedMenu = async () => {
  const items = MOCK_MENU_ITEMS;
  try {
    for (const item of items) {
      await addDoc(collection(db, 'menuItems'), item);
    }
  } catch (e) {
    console.warn("Seeding failed (permission denied). This is expected in Demo mode.");
    throw e;
  }
};