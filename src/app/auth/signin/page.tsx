// src/app/auth/signin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { createClient } from '@/utils/supabase/client';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState('');
  const [hashedNonce, setHashedNonce] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Generate a nonce on mount for secure Google OAuth
    const thisNonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
    setNonce(thisNonce);

    // Hash the nonce for Google OAuth
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(thisNonce);
    crypto.subtle.digest("SHA-256", encodedNonce).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      setHashedNonce(
        hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      );
    });

    console.log('SignIn component mounted');
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting email/password sign in');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Sign in successful, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <div className="flex justify-center">
            <GoogleLogin
              nonce={hashedNonce}
              onSuccess={async (credentialResponse) => {
                try {
                  console.log('Google login successful, processing token');
                  const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: "google",
                    token: credentialResponse.credential || "",
                    nonce: nonce,
                  });

                  if (error) throw error;
                  
                  console.log('Google sign in successful, redirecting to dashboard');
                  router.push('/dashboard');
                } catch (error: any) {
                  console.error('Google sign in error:', error.message);
                  setError(error.message || 'An error occurred during Google sign in');
                }
              }}
              onError={() => {
                console.error("Google Login Failed");
                setError("Google sign in failed. Please try again or use email.");
              }}
            />
          </div>
        </GoogleOAuthProvider>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-b border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or continue with email</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}