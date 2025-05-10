// app/page.tsx
'use client';

import ConceptMapEditor from '@/components/ConceptMapEditor';

export default function Home() {
  return (
    <main className="min-h-screen">
      <ConceptMapEditor />
    </main>
  );
}