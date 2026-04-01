import { redirect } from 'next/navigation';

export default function Home() {
  // For now, go straight to admin.
  // Once auth is wired up, this will check the session
  // and route to /admin or /portal based on role.
  redirect('/portal');
}
