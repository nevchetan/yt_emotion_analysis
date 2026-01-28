"use client";

import { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 * Prevents entire app from crashing due to component errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 text-center mb-4">
                An unexpected error occurred. Please try again.
              </p>
              <details className="mb-6 p-3 bg-red-50 rounded border border-red-200">
                <summary className="cursor-pointer font-mono text-xs text-red-700">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
              <button
                onClick={this.handleReset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
