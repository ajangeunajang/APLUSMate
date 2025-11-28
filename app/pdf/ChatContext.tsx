"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  captureMode: boolean;
  setCaptureMode: (mode: boolean) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  publicId: string;
  setPublicId: (id: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, publicId: initialPublicId }: { children: ReactNode; publicId?: string }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [captureMode, setCaptureMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [publicId, setPublicId] = useState(initialPublicId || "");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <ChatContext.Provider value={{ 
      chatOpen, 
      setChatOpen,
      captureMode,
      setCaptureMode,
      capturedImage,
      setCapturedImage,
      publicId,
      setPublicId,
      currentPage,
      setCurrentPage
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
