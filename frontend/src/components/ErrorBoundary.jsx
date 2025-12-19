import React from 'react';
import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-50">
          <div className="bg-orange-100 p-6 rounded-full text-orange-500 mb-6">
            <AlertTriangle size={64} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-8 max-w-md">
            We encountered an unexpected error. Our team has been notified.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
