import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgriOptima Uncaught UI Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('agrioptima_session_state_v1');
      localStorage.removeItem('agrioptima_farm_params_v1');
      localStorage.removeItem('agrioptima_farm_decision_v1');
      localStorage.removeItem('agrioptima_plan_lifecycle_v1');
      localStorage.removeItem('agrioptima_is_demo_v1');
      localStorage.removeItem('agrioptima_demo_name_v1');
    } catch {}
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] w-full flex-col items-center justify-center p-6 text-center text-[var(--ink)]">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface-elevated)] p-8 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--warn-tint)] text-[var(--warn-deep)] shadow-inner">
              <AlertTriangle size={28} />
            </div>

            <h2 className="t-h3 mt-5 text-[1.25rem] text-[var(--ink)]">
              {this.props.fallbackTitle || 'कुछ समस्या आई · Something went wrong'}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              {this.props.fallbackMessage ||
                'पृष्ठ लोड करने में अस्थायी समस्या आई। कृपया पृष्ठ पुनः लोड करें या सत्र रीसेट करें।'}
            </p>

            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]">
                  तकनीकी विवरण · Technical details
                </summary>
                <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[var(--line-soft)] bg-[var(--paper)] p-3 font-mono text-[11px] text-[var(--risk-deep)]">
                  <p className="font-bold">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-[var(--ink-faint)]">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-sm flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>पुनः लोड करें (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-ghost btn-sm flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>सत्र रीसेट करें (Reset)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

}
