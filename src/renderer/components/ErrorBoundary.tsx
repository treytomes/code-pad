import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Log to electron-log if available
    if (window.electronAPI?.logger) {
      window.electronAPI.logger.error('React error boundary caught:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={
            <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <p>CodePad encountered an unexpected error. This has been logged for debugging.</p>
              {this.state.error && (
                <details style={{ marginTop: '16px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
                  <pre
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '300px',
                    }}
                  >
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>
          }
          extra={[
            <Button key="reset" onClick={this.handleReset}>
              Try Again
            </Button>,
            <Button key="reload" type="primary" onClick={this.handleReload}>
              Reload Application
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}
