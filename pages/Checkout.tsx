import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../contexts/AuthContext';
import { createOrder } from '../services/firestoreService';
import { generateTimeSlots, formatTime, formatPrice } from '../utils/formatters';
import { ROUTES } from '../constants';
import { ArrowLeft, QrCode, AlertCircle } from 'lucide-react';
import { UPIPayment } from '../components/UPIPayment';
import { sanitizeInput } from '../utils/security';
import { SuccessScreen } from '../components/SuccessScreen';

export const Checkout: React.FC = () => {
  const { items, quantities, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Checkout State
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [step, setStep] = useState<'slot' | 'payment'>('slot');

  // Contact Details
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerMobile, setCustomerMobile] = useState('');
  
  // Loading & Error State
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{name?: string; mobile?: string; slot?: string}>({});
  
  // Animation State
  const [showSuccess, setShowSuccess] = useState(false);

  // Note: user check is now handled by ProtectedRoute in App.tsx
  
  // Don't redirect home if we are showing the success animation, even if cart is empty (because clearCart runs before animation completes)
  if (items.length === 0 && !showSuccess) {
    // We can use a direct redirect here for empty cart as it's a logic check, not auth check
    navigate(ROUTES.HOME);
    return null;
  }

  const slots = generateTimeSlots();

  const handleProceedToPayment = () => {
    const errors: {name?: string; mobile?: string; slot?: string} = {};
    let hasError = false;

    if (!customerName.trim()) {
      errors.name = "Name is required.";
      hasError = true;
    }

    if (!customerMobile.trim()) {
      errors.mobile = "Mobile number is required.";
      hasError = true;
    } else if (customerMobile.replace(/\D/g, '').length < 10) {
      errors.mobile = "Please enter a valid mobile number (min 10 digits).";
      hasError = true;
    }

    if (!selectedSlot) {
      errors.slot = "Please select a pickup time.";
      hasError = true;
    }

    setFieldErrors(errors);

    if (hasError) {
      setGlobalError("Please correct the highlighted errors before proceeding.");
      return;
    }

    setGlobalError('');
    setStep('payment');
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    if (!selectedSlot || !user) return;

    // Sanitize inputs before sending to DB
    const safeName = sanitizeInput(customerName);
    const safeMobile = sanitizeInput(customerMobile);
    const safeTxId = sanitizeInput(transactionId);

    try {
      const slotId = selectedSlot.toISOString();
      await createOrder(
        user.uid,
        user.email,
        items,
        quantities,
        slotId,
        selectedSlot,
        safeTxId,
        safeName,
        safeMobile
      );
      
      // Order created successfully - Trigger Animation
      setShowSuccess(true);
      
      // We clear the cart now, but we don't navigate yet. 
      // The component will stay mounted because of the `showSuccess` check above.
      clearCart();
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("SLOT_FULL")) {
        setGlobalError("The selected time slot just filled up. Please select another.");
        setStep('slot');
      } else {
        setGlobalError("Failed to create order. Please try again.");
      }
    }
  };

  const onAnimationComplete = () => {
    navigate(ROUTES.ORDERS);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <SuccessScreen 
        isVisible={showSuccess} 
        message="Order Placed" 
        subMessage="We are preparing your meal"
        onComplete={onAnimationComplete} 
      />

      {step === 'slot' && (
        <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Menu
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 animate-fade-in relative">
        
        {/* LEFT COLUMN: Main Interaction Area */}
        <div className="lg:col-span-7 space-y-12">
          {step === 'slot' ? (
            <>
              <div>
                <h2 className="text-3xl font-serif font-bold text-black dark:text-white mb-2">Checkout Details</h2>
                <p className="text-gray-500 text-sm">Review your details and schedule a pickup.</p>
              </div>
              
              <div className="space-y-10">
                
                {/* Contact Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 dark:border-gray-800 pb-2">Contact Info</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        NAME <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                        }}
                        className={`w-full bg-gray-50 dark:bg-black border p-4 text-black dark:text-white outline-none transition-colors ${
                          fieldErrors.name 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white'
                        }`}
                        placeholder="Enter your name"
                      />
                      {fieldErrors.name && (
                        <p className="text-red-500 text-xs mt-2 flex items-center font-medium">
                          <AlertCircle className="w-3 h-3 mr-1" /> {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        MOBILE NUMBER <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel" 
                        value={customerMobile}
                        onChange={(e) => {
                          setCustomerMobile(e.target.value);
                          if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: undefined }));
                        }}
                        className={`w-full bg-gray-50 dark:bg-black border p-4 text-black dark:text-white outline-none transition-colors ${
                          fieldErrors.mobile 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white'
                        }`}
                        placeholder="e.g. 9876543210"
                      />
                      {fieldErrors.mobile && (
                        <p className="text-red-500 text-xs mt-2 flex items-center font-medium">
                          <AlertCircle className="w-3 h-3 mr-1" /> {fieldErrors.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slot Section */}
                 <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-2">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                       Pickup Time <span className="text-red-500">*</span>
                     </h3>
                     {fieldErrors.slot && (
                       <span className="text-red-500 text-xs flex items-center font-medium">
                         <AlertCircle className="w-3 h-3 mr-1" /> {fieldErrors.slot}
                       </span>
                     )}
                   </div>
                   <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3 p-1 transition-colors rounded-sm ${fieldErrors.slot ? 'bg-red-50 dark:bg-red-900/10 border border-dashed border-red-500/50' : ''}`}>
                     {slots.map((slot) => (
                       <button
                         key={slot.toISOString()}
                         onClick={() => {
                           setSelectedSlot(slot);
                           if (fieldErrors.slot) setFieldErrors(prev => ({ ...prev, slot: undefined }));
                         }}
                         className={`px-2 py-4 text-sm font-mono transition-all border ${
                           selectedSlot === slot
                             ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md transform scale-105'
                             : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                         }`}
                       >
                         {formatTime(slot)}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 {globalError && (
                   <div className="text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 flex items-start">
                     <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                     {globalError}
                   </div>
                 )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                 <h2 className="text-3xl font-serif font-bold text-black dark:text-white">Payment</h2>
                 <p className="text-gray-500 mt-2">Scan QR code or pay via UPI App to complete order.</p>
              </div>
              <UPIPayment 
                amount={totalPrice} 
                onSuccess={handlePaymentSuccess}
                onCancel={() => setStep('slot')}
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-24 bg-white dark:bg-black p-8 border border-gray-200 dark:border-white shadow-xl dark:shadow-none transition-colors duration-300">
            <h3 className="text-xl font-serif font-bold text-black dark:text-white mb-6 border-b border-gray-200 dark:border-white pb-4">Order Summary</h3>
            <ul className="space-y-4 mb-8">
              {items.map(item => (
                <li key={item.id} className="flex justify-between text-sm items-start">
                  <span className="text-black dark:text-white font-medium">
                    <span className="text-gray-500 mr-2 font-mono text-xs border border-gray-200 dark:border-gray-800 px-1.5 py-0.5 rounded">{quantities[item.id]}x</span> 
                    {item.name}
                  </span>
                  <span className="font-mono text-gray-500 dark:text-gray-400">{formatPrice(item.price * quantities[item.id])}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex justify-between items-center border-t border-dashed border-gray-300 dark:border-gray-700 pt-6 mb-8">
              <span className="font-bold text-black dark:text-white uppercase tracking-widest text-sm">Total Amount</span>
              <span className="font-bold font-mono text-2xl text-black dark:text-white">{formatPrice(totalPrice)}</span>
            </div>

            {step === 'slot' && (
              <button
                onClick={handleProceedToPayment}
                className="w-full flex justify-center items-center px-6 py-5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
              >
                  <>
                    Proceed to Payment <QrCode className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
              </button>
            )}
            
            {step === 'slot' && !selectedSlot && (
              <p className="text-xs text-center text-gray-500 mt-4 uppercase tracking-wide">Please select a pickup time</p>
            )}
            
            {selectedSlot && (
              <div className="mt-6 flex items-center justify-center text-xs text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-zinc-900 py-3 rounded-sm">
                 Pickup at <span className="text-black dark:text-white font-bold ml-2">{formatTime(selectedSlot)}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};