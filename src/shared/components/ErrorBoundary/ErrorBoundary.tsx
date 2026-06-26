import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches unhandled React render errors and shows a recovery UI
 * instead of a blank screen. Wrap at the app root.
 *
 * Must be a class component — React doesn't support hook-based error boundaries.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would go to an error tracking service (e.g. Datadog RUM)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__card">
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              An unexpected error occurred. Try reloading — if it keeps happening, contact support.
            </p>
            <details className="error-boundary__details">
              <summary>Error details</summary>
              <pre>{this.state.error.message}</pre>
            </details>
            <button type="button" className="btn btn--primary" onClick={this.handleReset}>
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
