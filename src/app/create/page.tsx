'use client';

import ResourceGenerator from '@/components/ResourceGenerator';
import { useEffect } from 'react';

export default function CreatePage() {
  useEffect(() => {
    console.log('Create page loaded');
  }, []);
  
  return (
    <main className="min-h-screen pt-20">
      <ResourceGenerator />
    </main>
  );
} 