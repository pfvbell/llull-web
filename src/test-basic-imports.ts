// src/test-basic-imports.ts
// A simple test file that only tests basic imports without relying on environment variables

// Import some basic packages
import fs from 'fs';
import path from 'path';

// Log for debugging
console.log('Starting basic import test...');

// Test a simple function
function hello() {
  return 'Hello, imports are working!';
}

// Run the test
console.log(hello());
console.log('Test complete. If you see this message, basic imports are working.'); 