// // frontend/src/components/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error to console — replace with your monitoring service if desired
    console.error('ErrorBoundary caught an error', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-500 mb-6">
              We encountered an unexpected error. Please try refreshing the page or try again later.
            </p>

            {/* Error Details (Optional, good for dev debugging) */}
            {this.state.error?.message && (
              <div className="bg-red-50 rounded-lg p-3 mb-6 text-left overflow-hidden">
                <p className="text-xs font-mono text-red-700 break-words">
                  Error: {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.reset}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <RefreshCw size={18} /> Try Again
            </button>

            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline decoration-gray-300 underline-offset-2"
            >
                Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}