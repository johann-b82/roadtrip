export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 px-4">
      <div className="text-center max-w-md">
        {/* Travel-themed illustration: compass/map icon */}
        <div className="text-7xl mb-6" aria-hidden="true">🗺️</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Looks like we took a wrong turn
        </h1>
        <p className="text-slate-600 mb-2 text-sm">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <p className="text-slate-500 mb-8 text-sm">
          Try going back to the dashboard, or reload the page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium min-h-[44px]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
