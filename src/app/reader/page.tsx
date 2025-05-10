'use client';

import { Suspense } from 'react';
import Reader from '@/components/Reader';

export default function ReaderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Reader</h1>
      
      <Suspense fallback={<div className="p-4 text-center">Loading Reader...</div>}>
        <Reader />
      </Suspense>
    </div>
  );
} 