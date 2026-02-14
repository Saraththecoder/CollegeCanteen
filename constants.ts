
export const ADMIN_EMAIL = "admin@canteen.com"; // In real app, use process.env.REACT_APP_ADMIN_EMAIL

// UPI CONFIGURATION
export const UPI_VPA = "8074244332@axl"; // REPLACE WITH YOUR MERCHANT UPI ID
export const UPI_PAYEE_NAME = "Noir Canteen";

export const CURRENCY_SYMBOL = "₹"; // Changed to Rupee for UPI context

export const APP_NAME = "NOIR CANTEEN";

export const TIME_SLOT_INTERVAL_MINUTES = 15;
export const MAX_ORDERS_PER_SLOT = 20;
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 20;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ORDERS: '/orders',
  ADMIN: '/admin',
  CHECKOUT: '/checkout',
};