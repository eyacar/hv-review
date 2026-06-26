import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'

// Initialize theme before first paint to avoid flash.
// Priority: 1) user's saved preference, 2) OS preference, 3) light fallback.
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const savedTheme = localStorage.getItem('theme') ?? (systemPrefersDark ? 'dark' : 'light')
document.documentElement.setAttribute('data-theme', savedTheme)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
