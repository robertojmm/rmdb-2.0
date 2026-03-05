import { Component, type ReactNode, type ErrorInfo } from 'react'
import { logger } from '../lib/logger'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('React render error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">Something went wrong</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
