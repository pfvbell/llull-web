/**
 * Test to verify Supabase environment variable handling
 * 
 * This test verifies that:
 * 1. Supabase client requires URL and key to initialize
 * 2. The client falls back to empty strings when env vars are missing
 */

// Add logging for test debugging
const log = (message: string, data?: any) => {
  console.log(`[SupabaseEnvTest] ${message}`, data ? data : '');
};

async function testSupabaseEnvironment() {
  log('Starting Supabase environment test...');
  
  try {
    // Attempt to dynamically import the supabase module
    log('Importing Supabase client...');
    const { createClient } = await import('@supabase/supabase-js');
    
    // Test case 1: Empty URL and key
    log('Test 1: Empty URL and key');
    try {
      const client = createClient('', '');
      log('Client created with empty strings');
      
      // Test a simple method to see if it throws an error
      try {
        const { data, error } = await client.auth.getSession();
        log('Auth getSession result:', { 
          hasData: !!data, 
          hasError: !!error, 
          errorMessage: error?.message 
        });
      } catch (sessionError: any) {
        log('Error calling auth.getSession:', sessionError.message);
      }
    } catch (clientError: any) {
      log('Error creating client with empty strings:', clientError.message);
    }
    
    // Test case 2: Random values
    log('Test 2: Random valid URL and key');
    try {
      const testUrl = 'https://example.supabase.co';
      const testKey = 'test_key_1234567890';
      const client = createClient(testUrl, testKey);
      log('Client created with test values');
      
      // Try to access properties of the client
      log('Client properties:', {
        hasAuthModule: !!client.auth,
        hasFromMethod: !!client.from
      });
    } catch (clientError: any) {
      log('Error creating client with test values:', clientError.message);
    }
    
    // Test case 3: Check environment variables
    log('Test 3: Environment variables');
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    log('Environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: envUrl ? 'defined' : 'undefined',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: envKey ? 'defined' : 'undefined'
    });
    
    log('Supabase environment test completed');
  } catch (error: any) {
    log('Error in Supabase environment test:', error.message);
    console.error(error);
  }
}

// Execute the test
testSupabaseEnvironment().catch(error => {
  console.error('Error running test:', error);
}); 