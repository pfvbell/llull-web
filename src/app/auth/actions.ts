'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Extract data from form submission
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Server action: Attempting login with email', data.email)
  
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message)
    // In a real app, you might want to pass this error back to the client
    // For now, redirecting to an error page or back to login
    return { error: error.message }
  }

  console.log('Login successful, redirecting to dashboard')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Extract data from form submission
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Server action: Attempting signup with email', data.email)
  
  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error.message)
    return { error: error.message }
  }

  console.log('Signup successful')
  // We could redirect to a confirmation page or back to login
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  
  console.log('Server action: Logging out user')
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/')
} 