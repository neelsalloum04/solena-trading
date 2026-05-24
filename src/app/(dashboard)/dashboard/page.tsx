import { redirect } from 'next/navigation'

// V1 : le dashboard redirige vers le Chat IA (page principale)
export default function DashboardPage() {
  redirect('/chat')
}
