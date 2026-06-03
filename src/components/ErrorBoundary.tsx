import { Component } from 'react';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null; info: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Render error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
    this.setState({ info: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-svh flex items-center justify-center p-4 bg-gray-50">
          <div className="bg-white rounded-xl p-6 shadow-sm max-w-sm w-full space-y-3">
            <p className="text-red-500 font-medium">レンダリングエラーが発生しました</p>
            <div className="bg-red-50 rounded-lg p-3 text-xs font-mono text-red-700 break-all">
              {this.state.error.message || '(メッセージなし)'}
            </div>
            {this.state.info && (
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer">コンポーネントスタック</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">{this.state.info}</pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
