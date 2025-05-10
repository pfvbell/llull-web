// src/components/ui/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
        console.log('Navbar: User authenticated:', data?.user ? 'yes' : 'no');
      } catch (error) {
        console.error('Navbar: Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Navbar: Auth state changed:', event);
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Log when navbar renders with its styling
  useEffect(() => {
    console.log('Navbar rendered with solid background');
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('Navbar: Signing out user');
      await supabase.auth.signOut();
      console.log('Navbar: Sign out successful');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Navbar: Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="heading-font text-4xl font-bold text-blue-600">llull</span>
            </Link>
            <div className="ml-6 flex space-x-4">
              <Link
                href="/create"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/create'
                    ? 'bg-beige-100 text-blue-600'
                    : 'text-gray-700 hover:bg-beige-100'
                }`}
              >
                Create
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/dashboard'
                    ? 'bg-beige-100 text-blue-600'
                    : 'text-gray-700 hover:bg-beige-100'
                }`}
              >
                Memory Bank
              </Link>
              <Link
                href="/reader"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/reader'
                    ? 'bg-beige-100 text-blue-600'
                    : 'text-gray-700 hover:bg-beige-100'
                }`}
              >
                Reader
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {loading ? (
              <div className="h-6 w-6 animate-pulse bg-beige-200 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}