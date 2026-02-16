import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 600

export default function Page() {
  notFound()
}

export async function generateMetadata() {
  return { title: 'Not Found' }
}
