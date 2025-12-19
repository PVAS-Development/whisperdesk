import React, { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { logger } from '../../../services/logger';
import './ErrorBoundary.css';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <AlertTriangle size={48} className="error-boundary-icon" aria-hidden="true" />
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              An unexpected error occurred. Please try reloading the application.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="error-boundary-details">{this.state.error.message}</pre>
            )}
            <div className="error-boundary-actions">
              <Button variant="primary" icon={<RefreshCw size={16} />} onClick={this.handleReload}>
                Reload Application
              </Button>
              <Button variant="secondary" onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
