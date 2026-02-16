import { notFound } from 'next/navigation'

export const revalidate = 600

export function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{ pageNumber: string }>
}

export default async function Page(_args: Args) {
  notFound()
}

export async function generateMetadata(_args: Args) {
  return { title: 'Not Found' }
}
