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
 * - activeMobileTab: controls which panel is visible on mobile.
 *   Lives here (not in ReviewPage) so IssueCard can switch to 'document'
 *   when a user taps an issue — without prop drilling.
 */

export type MobileTab = 'document' | 'issues'

interface ReviewStore {
  currentPage: number
  ignoredIssues: Set<string>
  activeMobileTab: MobileTab
  setCurrentPage: (page: number) => void
  ignoreIssue: (id: string) => void
  unignoreIssue: (id: string) => void
  setActiveMobileTab: (tab: MobileTab) => void
  /** Reset all review state when navigating to a different review. */
  reset: () => void
}

export const useReviewStore = create<ReviewStore>(set => ({
  currentPage: 1,
  ignoredIssues: new Set(),
  activeMobileTab: 'document',

  setCurrentPage: (page: number) => set({ currentPage: page }),
  setActiveMobileTab: (tab: MobileTab) => set({ activeMobileTab: tab }),

  ignoreIssue: (id: string) =>
    set(state => ({
      // Immutable Set — Zustand uses reference equality to detect changes
      ignoredIssues: new Set([...state.ignoredIssues, id]),
    })),

  unignoreIssue: (id: string) =>
    set(state => {
      const next = new Set(state.ignoredIssues)
      next.delete(id)
      return { ignoredIssues: next }
    }),

  reset: () =>
    set({
      currentPage: 1,
      ignoredIssues: new Set(),
      activeMobileTab: 'document',
    }),
}))
