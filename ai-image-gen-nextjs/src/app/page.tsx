import { redirect } from 'next/navigation';

// This component will be rendered server-side and immediately trigger a redirect.
export default function RootPage() {
  redirect('/generate');

  // Note: Next.js might optimize this during build, but functionally,
  // the redirect happens before any rendering output would be sent.
  // We don't strictly need to return anything here, but could add a fallback.
  // return null;
} 