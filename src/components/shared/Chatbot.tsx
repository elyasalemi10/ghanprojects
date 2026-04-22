import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Calendar, CalendarCheck, Mail } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type LoadingState = 'thinking' | 'checking_availability' | 'booking' | 'sending_inquiry' | null;

const loadingMessages: Record<NonNullable<LoadingState>, { text: string; icon: typeof Loader2 }> = {
  thinking: { text: 'Thinking...', icon: Loader2 },
  checking_availability: { text: 'Checking availability...', icon: Calendar },
  booking: { text: 'Booking your consultation...', icon: CalendarCheck },
  sending_inquiry: { text: 'Sending your inquiry...', icon: Mail },
};

const STORAGE_KEY = 'ghan_chatbot_messages';
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm the Ghan Projects assistant. I can help you book a consultation, check our availability, or answer questions about our property services. How can I help you today?"
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // Invalid JSON, use default
        }
      }
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't close if clicking the chat button
    if (target.closest('[data-chat-button]')) return;
    
    if (chatWindowRef.current && !chatWindowRef.current.contains(target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const sendMessage = async () => {
    if (!input.trim() || loadingState) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoadingState('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(1) // Skip initial greeting for API
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      if (data.toolUsed) {
        if (data.toolUsed === 'check_availability') {
          setLoadingState('checking_availability');
        } else if (data.toolUsed === 'book_meeting') {
          setLoadingState('booking');
        } else if (data.toolUsed === 'send_inquiry') {
          setLoadingState('sending_inquiry');
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact us directly at our office." 
      }]);
    } finally {
      setLoadingState(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loadingState) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        data-chat-button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-accent hover:bg-accent/90 text-white p-3 sm:p-4 rounded-full shadow-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 sm:bottom-24 right-2 sm:right-6 left-2 sm:left-auto z-50 sm:w-[380px] bg-background shadow-2xl flex flex-col overflow-hidden rounded-lg"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Ghan Projects</h3>
                  <p className="text-[10px] sm:text-xs opacity-80">Property Consultation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    className="text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-[250px] sm:min-h-[300px] max-h-[350px] sm:max-h-[400px]">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-none'
                        : 'bg-secondary/50 text-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loadingState && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary/50 p-2.5 sm:p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                    {(() => {
                      const { text, icon: Icon } = loadingMessages[loadingState];
                      return (
                        <>
                          <Icon className="w-4 h-4 animate-spin text-accent" />
                          <span className="text-sm text-muted-foreground">{text}</span>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={loadingState ? "Wait for response..." : "Type your message..."}
                  className="flex-1 bg-secondary/30 border border-border px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !!loadingState}
                  className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 sm:p-3 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-2 text-center">
                Powered by AI • Book consultations 48+ hours in advance
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
