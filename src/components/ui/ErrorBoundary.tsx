import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black text-center">
          <p className="text-gray-800 dark:text-white text-lg font-medium mb-2">
            Algo deu errado ao carregar
          </p>
          <p className="text-gray-600 dark:text-white/70 text-sm mb-6 max-w-sm">
            Pode ser a conexão ou um problema temporário. Tente novamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
