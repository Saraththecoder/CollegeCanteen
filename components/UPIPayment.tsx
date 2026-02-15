import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UPI_VPA, UPI_PAYEE_NAME, APP_NAME } from '../constants';
import { formatPrice } from '../utils/formatters';
import { Loader2, Send, Smartphone, Copy, Check } from 'lucide-react';

interface UPIPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => Promise<void>;
  onCancel: () => void;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({ amount, onSuccess, onCancel }) => {
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate a unique transaction reference for this session
  // This helps banking apps identify the transaction and often bypasses generic security blocks
  const transactionRef = useMemo(() => `T${Date.now()}`, []);

  // Construct UPI URL
  // format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=<currency>&tn=<note>&tr=<ref>
  const upiUrl = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order at ${APP_NAME}`)}&tr=${transactionRef}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError("Please enter the Transaction ID / UTR");
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSuccess(transactionId);
    } catch (err) {
      setError("Failed to process order. Please try again.");
      setIsSubmitting(false);
    }
  };

  const copyVpa = () => {
    navigator.clipboard.writeText(UPI_VPA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      <div className="bg-white text-black p-6 border border-gray-200">
        <h3 className="font-serif font-bold text-xl mb-6 text-center">Scan or Click to Pay</h3>
        
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="bg-white p-4 border-2 border-dashed border-gray-300 relative">
             <QRCodeSVG value={upiUrl} size={200} />
          </div>

          <div className="w-full space-y-3 md:hidden">
            <a 
              href={upiUrl}
              className="flex items-center justify-center w-full px-6 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors rounded-none"
            >
              <Smartphone className="w-4 h-4 mr-2" /> Pay via UPI App
            </a>
            <p className="text-[10px] text-center text-gray-500">
              If the button doesn't work, copy the UPI ID below and pay manually.
            </p>
          </div>
          
          <div className="text-center w-full">
            <p className="text-3xl font-mono font-bold">{formatPrice(amount)}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-gray-500 uppercase tracking-widest">To: {UPI_PAYEE_NAME}</span>
            </div>
            
            <button 
              onClick={copyVpa}
              className="mt-2 flex items-center justify-center gap-2 text-xs font-mono bg-gray-100 px-3 py-1 rounded mx-auto hover:bg-gray-200 transition-colors"
            >
              {UPI_VPA}
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500 leading-relaxed">
             1. Open PhonePe, Google Pay, or Paytm.<br/>
             2. Scan QR code OR Click 'Pay via UPI App'.<br/>
             3. Complete payment and <strong>copy the UTR / Transaction ID.</strong><br/>
             4. Paste the ID below to confirm.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-black border border-white p-6">
        <h4 className="text-white font-serif font-bold mb-4">Verification</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Transaction ID / UTR</label>
            <input 
              type="text" 
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 308572189..."
              className="w-full bg-gray-900 border border-gray-700 px-4 py-3 focus:border-white text-white outline-none transition-colors font-mono"
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-4 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-transparent hover:border-gray-800"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!transactionId || isSubmitting}
              className="flex-1 bg-white text-black py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Order <Send className="w-4 h-4 ml-2" /></>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};