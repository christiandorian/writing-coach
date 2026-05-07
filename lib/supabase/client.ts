import { createBrowserClient } from '@supabase/ssr'

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url?.startsWith('http')) return url
  return 'https://placeholder.supabase.co'
}

function getKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (key && !key.includes('_here')) return key
  return 'placeholder-anon-key'
}

export function createClient() {
  return createBrowserClient(getUrl(), getKey())
}
