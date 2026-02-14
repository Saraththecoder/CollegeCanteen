import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentId: string) => Promise<void>;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Confirm Payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Prevents redirecting if not using 3D secure
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // 2. Payment Succeeded, trigger parent callback to save order
      try {
        await onSuccess(paymentIntent.id);
      } catch (e) {
        setErrorMessage("Payment succeeded but order creation failed. Please contact support.");
        setIsProcessing(false);
      }
    } else {
      setErrorMessage("Unexpected payment status.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-black border border-white p-6 mb-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
          <h3 className="text-xl font-serif font-bold text-white">Secure Payment</h3>
          <Lock className="w-4 h-4 text-gray-500" />
        </div>
        
        <PaymentElement />
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-900 text-red-200 text-sm">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-4 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-transparent hover:border-gray-800"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-white text-black py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${formatPrice(amount)}`}
        </button>
      </div>
    </form>
  );
};