/**
 * ChatbotContext - Manages persistent chatbot session across page navigation
 * 
 * This context ensures the chatbot session persists when users navigate between pages.
 * The session ID is stored in localStorage and retrieved on app initialization.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../services/api';

interface ChatbotContextType {
  sessionId: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  createNewSession: () => Promise<void>;
  clearSession: () => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'camelot_chatbot_session_id';

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (isInitialized) return;
      
      // Try to restore session from localStorage
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedSessionId) {
        // Verify session still exists
        try {
          const session = await ApiService.getChatSession(storedSessionId);
          if (session && session.session_id) {
            setSessionId(session.session_id);
            setIsInitialized(true);
            return;
          }
        } catch (err) {
          // Session doesn't exist, create new one
          console.log('Stored session not found, creating new session');
        }
      }
      
      // Create new session if none exists
      await createNewSession();
      setIsInitialized(true);
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewSession = async () => {
    try {
      const session = await ApiService.createChatSession();
      setSessionId(session.session_id);
      localStorage.setItem(SESSION_STORAGE_KEY, session.session_id);
    } catch (err: any) {
      console.error('Failed to create chatbot session:', err);
    }
  };

  const clearSession = async () => {
    if (sessionId) {
      try {
        await ApiService.clearChatSession(sessionId);
      } catch (err) {
        console.error('Failed to clear session:', err);
      }
    }
    setSessionId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    await createNewSession();
  };

  return (
    <ChatbotContext.Provider
      value={{
        sessionId,
        isOpen,
        setIsOpen,
        createNewSession,
        clearSession,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

