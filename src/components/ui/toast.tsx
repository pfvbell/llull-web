// src/components/ui/toast.tsx
'use client';

import React, { createContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextType {
  toast: (options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    console.log(`Toast created: ${title}`);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      
      {/* Toast display */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={`p-4 rounded-md shadow-md max-w-md ${
              t.variant === 'destructive' ? 'bg-red-100 border border-red-300' :
              t.variant === 'success' ? 'bg-green-100 border border-green-300' :
              'bg-white border border-gray-200'
            }`}
          >
            <div className="flex justify-between">
              <h3 className="font-medium">{t.title}</h3>
              <button onClick={() => dismiss(t.id)} className="text-gray-500">×</button>
            </div>
            {t.description && <p className="text-sm mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}