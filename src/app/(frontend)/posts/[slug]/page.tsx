import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{ slug?: string }>
}

export default async function PostPage(_args: Args) {
  notFound()
}

export async function generateMetadata(_args: Args) {
  return { title: 'Not Found' }
}
