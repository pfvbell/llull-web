# Llull Web

Web application for Llull.

## Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Debugging

The application includes comprehensive logging for debugging purposes:

- Console logging is enabled in development mode
- Server logs are available in the terminal running the Next.js process
- Client-side logs are available in the browser console
- API route logs are captured in the server logs
- Custom error boundaries provide detailed error information

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Add your environment variables here
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:components
pnpm test:memory-bank
pnpm test:processors
pnpm test:supabase-env
``` 