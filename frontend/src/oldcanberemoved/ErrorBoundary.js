import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send error to an error reporting service
    // Example: Sentry.captureException(error);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      // Custom fallback component provided
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Something went wrong
                  </h5>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <i className="fas fa-bug fa-3x text-danger mb-3"></i>
                    <h6>The application encountered an unexpected error</h6>
                    <p className="text-muted">
                      We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                    </p>
                  </div>

                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4">
                      <details className="border rounded p-3">
                        <summary className="cursor-pointer font-weight-bold">
                          Error Details (Development Mode)
                        </summary>
                        <div className="mt-3">
                          <h6>Error:</h6>
                          <pre className="bg-light p-2 rounded text-danger">
                            {this.state.error && this.state.error.toString()}
                          </pre>
                          
                          <h6 className="mt-3">Component Stack:</h6>
                          <pre className="bg-light p-2 rounded text-muted small">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-primary mr-3"
                      onClick={this.handleRetry}
                    >
                      <i className="fas fa-redo mr-2"></i>
                      Try Again
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => window.location.reload()}
                    >
                      <i className="fas fa-sync mr-2"></i>
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Custom Error Fallback Component
 */
export const CustomErrorFallback = ({ error, errorInfo, onRetry }) => (
  <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
    <div className="text-center">
      <div className="mb-4">
        <i className="fas fa-exclamation-circle fa-5x text-warning"></i>
      </div>
      <h2 className="mb-3">Oops! Something went wrong</h2>
      <p className="text-muted mb-4 lead">
        We're experiencing some technical difficulties. Please try again in a moment.
      </p>
      <div>
        <button className="btn btn-primary btn-lg mr-3" onClick={onRetry}>
          <i className="fas fa-redo mr-2"></i>
          Try Again
        </button>
        <button 
          className="btn btn-outline-secondary btn-lg"
          onClick={() => window.location.href = '/'}
        >
          <i className="fas fa-home mr-2"></i>
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Higher-Order Component for Error Boundary
 */
export const withErrorBoundary = (Component, errorFallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    console.error('Error handled by useErrorHandler:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, clearError };
};

export default ErrorBoundary;
