"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  captureMode: boolean;
  setCaptureMode: (mode: boolean) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [captureMode, setCaptureMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ 
      chatOpen, 
      setChatOpen,
      captureMode,
      setCaptureMode,
      capturedImage,
      setCapturedImage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
