import { notFound } from 'next/navigation'

type Args = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage(_args: Args) {
  notFound()
}

export async function generateMetadata(_args: Args) {
  return { title: 'Search' }
}
