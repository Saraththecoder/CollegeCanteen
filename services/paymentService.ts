import { getFunctions, httpsCallable } from 'firebase/functions';

// This function calls your backend to create a PaymentIntent
// You must deploy a Firebase Cloud Function named 'createPaymentIntent' for this to work.
export const createPaymentIntent = async (amount: number, currency: string = 'usd'): Promise<string> => {
  const functions = getFunctions();
  const createPaymentIntentFunction = httpsCallable(functions, 'createPaymentIntent');
  
  try {
    const result = await createPaymentIntentFunction({ amount: amount * 100, currency }); // Amount in cents
    const data = result.data as { clientSecret: string };
    return data.clientSecret;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    // FALLBACK FOR DEMO ONLY: 
    // If backend function is not set up, we throw specific error to handle in UI
    throw new Error("PAYMENT_BACKEND_NOT_CONFIGURED");
  }
};