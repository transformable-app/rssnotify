import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">rssnotify</h1>
      <Link href="/admin" className="text-primary underline">
        Go to Admin
      </Link>
    </div>
  )
}
