import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { createOrder } from '../services/firestoreService';
import { generateTimeSlots, formatTime, formatPrice } from '../utils/formatters';
import { ROUTES } from '../constants';
import { Loader2, ArrowLeft } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { items, quantities, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <Navigate to={ROUTES.LOGIN} />;
  if (items.length === 0) return <Navigate to={ROUTES.HOME} />;

  const slots = generateTimeSlots();

  const handlePlaceOrder = async () => {
    if (!selectedSlot) return;
    setIsProcessing(true);
    setError('');

    try {
      const slotId = selectedSlot.toISOString();
      await createOrder(
        user.uid,
        user.email,
        items,
        quantities,
        slotId,
        selectedSlot
      );
      clearCart();
      navigate(ROUTES.ORDERS);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("SLOT_FULL")) {
        setError("The selected time slot just filled up. Please choose another.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Menu
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-8">Select Pickup Time</h2>
          <div className="space-y-6">
             <div className="grid grid-cols-3 gap-3">
               {slots.map((slot) => (
                 <button
                   key={slot.toISOString()}
                   onClick={() => setSelectedSlot(slot)}
                   className={`px-2 py-4 text-sm font-mono transition-all border ${
                     selectedSlot === slot
                       ? 'bg-white text-black border-white'
                       : 'bg-black border-gray-800 text-gray-500 hover:border-white hover:text-white'
                   }`}
                 >
                   {formatTime(slot)}
                 </button>
               ))}
             </div>
             {error && <p className="text-red-500 text-sm border border-red-900 bg-red-900/20 p-4">{error}</p>}
          </div>
        </div>

        <div className="bg-black p-8 border border-white h-fit">
          <h3 className="text-xl font-serif font-bold text-white mb-6 border-b border-white pb-4">Order Summary</h3>
          <ul className="space-y-4 mb-8">
            {items.map(item => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-white font-medium"><span className="text-gray-500 mr-2 font-mono">{quantities[item.id]}x</span> {item.name}</span>
                <span className="font-mono text-gray-400">{formatPrice(item.price * quantities[item.id])}</span>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-between items-center border-t border-dashed border-gray-700 pt-6 mb-8">
            <span className="font-bold text-white uppercase tracking-widest">Total</span>
            <span className="font-bold font-mono text-2xl text-white">{formatPrice(totalPrice)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!selectedSlot || isProcessing}
            className="w-full flex justify-center items-center px-6 py-5 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
          </button>
          
          {!selectedSlot && <p className="text-xs text-center text-gray-500 mt-4 uppercase tracking-wide">Please select a pickup time</p>}
        </div>
      </div>
    </div>
  );
};