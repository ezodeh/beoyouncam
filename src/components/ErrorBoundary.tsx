
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error("🚨 ErrorBoundary: Error caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 ErrorBoundary: Component error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-foreground mb-4">حدث خطأ</h1>
            <p className="text-muted-foreground mb-4">عذراً، حدث خطأ في التطبيق. يرجى تحديث الصفحة.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              تحديث الصفحة
            </button>
            {this.state.error && (
              <details className="mt-4 text-xs text-left">
                <summary>تفاصيل الخطأ</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
