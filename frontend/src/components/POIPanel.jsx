import { Sheet } from 'react-modal-sheet';
import { usePOIs } from '../hooks/usePOIs';
import POICard from './POICard';
import POISearchBar from './POISearchBar';

function POISkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-4 py-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-slate-200 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function POIContent({ stop, pois, categories, isLoading, error, search, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-800 truncate">
            {stop?.address || 'Stop'}
          </h2>
          <p className="text-xs text-slate-500">Points of interest nearby</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close POI panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      <POISearchBar
        categories={categories}
        onSearch={search}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <POISkeleton />
        ) : error ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : pois.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No POIs found in this area. Try expanding your search.</p>
          </div>
        ) : (
          <div className="space-y-2 px-4 py-3">
            {pois.map((poi) => (
              <POICard key={poi.id || poi.osm_id} poi={poi} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && !error && (
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            {pois.length} {pois.length === 1 ? 'point' : 'points'} of interest
          </p>
        </div>
      )}
    </>
  );
}

export default function POIPanel({ stop, onClose }) {
  const { pois, categories, isLoading, error, search } = usePOIs(stop?.id);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const contentProps = { stop, pois, categories, isLoading, error, search, onClose };

  // Mobile: bottom sheet (per D-02) — half-height default, drag up for full
  if (isMobile) {
    return (
      <Sheet
        isOpen={!!stop}
        onClose={onClose}
        snapPoints={[0.45, 0.75, 1]}
        initialSnap={0}
        detent="full-height"
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            <div className="flex flex-col h-full">
              <POIContent {...contentProps} />
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={onClose} />
      </Sheet>
    );
  }

  // Desktop: fixed right panel (original layout preserved)
  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-xl z-[1000] flex flex-col">
      <POIContent {...contentProps} />
    </div>
  );
}
