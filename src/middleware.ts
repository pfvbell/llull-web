import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // for proper session management
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logging for debugging
  console.log('Middleware executing, user:', user ? 'authenticated' : 'unauthenticated')

  // Optional: Redirect unauthenticated users for protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth/signin') &&
    !request.nextUrl.pathname.startsWith('/auth/signup')
  ) {
    // Check if this is a route that requires authentication
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/signin', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

// Specify the paths that should trigger the middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 