import { Checkout } from '@creem_io/nextjs';

export const GET = Checkout({
  apiKey: process.env.CREEM_API_KEY!,
  defaultSuccessUrl: '/generate',
  testMode: process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true',
});
