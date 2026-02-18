import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';
import { Sparkles, X, Send, User, Loader2 } from 'lucide-react';

interface AIChatProps {
  menuItems: MenuItem[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC<AIChatProps> = ({ menuItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to Noir. I know the menu by heart. What are you in the mood for?" }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    try {
      // Prepare context about the menu
      const menuContext = menuItems.map(item => 
        `${item.name} (${item.category}): ₹${item.price}. ${item.description}. ${item.isVegetarian ? 'Veg' : 'Non-Veg'}. ${item.fitnessGoal || ''}. ${!item.isAvailable ? '[SOLD OUT]' : ''}`
      ).join('\n');

      const systemPrompt = `You are the concierge for 'Noir Canteen'. 
      Your tone is sophisticated, minimalist, and helpful.
      Here is the current menu status:
      ${menuContext}
      
      Rules:
      1. Only recommend items from the list above.
      2. If a user asks for something not on the menu, politely suggest a similar alternative.
      3. Keep answers short (max 2 sentences).
      4. Mention price when recommending.
      5. Don't recommend sold-out items unless asked specifically.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // We combine system prompt and history for a simple stateless request (or use chat session)
      // For this implementation, we'll do a single turn with context to save tokens/complexity, 
      // but feeding previous 2 messages for continuity.
      const recentHistory = messages.slice(-2).map(m => `${m.role === 'user' ? 'Customer' : 'You'}: ${m.text}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${systemPrompt}\n\nConversation History:\n${recentHistory}\nCustomer: ${userMsg}\nYou:`,
      });

      const reply = response.text || "I apologize, I'm having trouble connecting to the kitchen.";
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection interruption. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${isOpen ? 'rotate-90 bg-white text-black' : 'bg-black text-white dark:bg-white dark:text-black'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-in origin-bottom-right max-h-[500px]">
          
          {/* Header */}
          <div className="bg-black dark:bg-white p-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-serif font-bold text-white dark:text-black">Noir Concierge</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200 dark:bg-zinc-800' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`p-3 text-sm max-w-[80%] rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-black dark:text-white rounded-tr-none' 
                    : 'bg-black dark:bg-white text-white dark:text-black rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white dark:text-black" />
                 </div>
                 <div className="bg-black dark:bg-white p-4 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-white dark:text-black" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for recommendations..."
                className="w-full bg-gray-100 dark:bg-black border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isThinking}
                className="absolute right-1 top-1 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-80 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};