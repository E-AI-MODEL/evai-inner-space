
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg m-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Er ging iets mis</h2>
          <p className="text-red-600 text-center mb-4 max-w-md">
            Een onverwachte fout heeft de applicatie onderbroken. Probeer de pagina te verversen of klik hieronder om opnieuw te proberen.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={this.handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Opnieuw proberen
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Pagina verversen
            </Button>
          </div>
          {this.state.error && (
            <details className="mt-4 text-xs text-gray-600">
              <summary className="cursor-pointer">Technische details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
