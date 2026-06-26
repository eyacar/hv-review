import { create } from 'zustand'

/**
 * Shared state between the DocumentViewer and IssuesPanel.
 *
 * These two components are siblings — lifting state to a common ancestor
 * would cause prop drilling through components that don't care about it.
 * Zustand lets each component subscribe only to what it needs.
 *
 * What lives here:
 * - currentPage: syncs the PDF viewer with the issues panel
 * - ignoredIssues: tracks which minor issues the user dismissed
 */

interface ReviewStore {
  currentPage: number
  ignoredIssues: Set<string>
  setCurrentPage: (page: number) => void
  ignoreIssue: (id: string) => void
  unignoreIssue: (id: string) => void
  isIgnored: (id: string) => boolean
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  currentPage: 1,
  ignoredIssues: new Set(),

  setCurrentPage: (page: number) => set({ currentPage: page }),

  ignoreIssue: (id: string) =>
    set(state => ({
      ignoredIssues: new Set([...state.ignoredIssues, id]),
    })),

  unignoreIssue: (id: string) =>
    set(state => {
      const next = new Set(state.ignoredIssues)
      next.delete(id)
      return { ignoredIssues: next }
    }),

  isIgnored: (id: string) => get().ignoredIssues.has(id),
}))
