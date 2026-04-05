import { useState } from 'react';

export default function TripCoverPhoto({ trip, photoUrls = [], photoMetadata = [], onSelectPhoto }) {
  const [currentIndex, setCurrentIndex] = useState(trip?.selected_photo_index || 0);

  // Use photoUrls prop if available (from trip creation); otherwise single photo from trip
  const allUrls = photoUrls.length > 0 ? photoUrls : (trip?.cover_photo_url ? [trip.cover_photo_url] : []);
  const currentUrl = allUrls[currentIndex] || null;
  const hasMultiple = allUrls.length > 1;

  function handlePrev() {
    const newIndex = (currentIndex - 1 + allUrls.length) % allUrls.length;
    setCurrentIndex(newIndex);
    onSelectPhoto?.(allUrls[newIndex], newIndex);
  }

  function handleNext() {
    const newIndex = (currentIndex + 1) % allUrls.length;
    setCurrentIndex(newIndex);
    onSelectPhoto?.(allUrls[newIndex], newIndex);
  }

  // Gradient fallback (D-16)
  if (!currentUrl) {
    return (
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-500 to-indigo-700">
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <h1 className="text-3xl font-bold text-white">{trip?.name}</h1>
          {trip?.description && (
            <p className="text-sm text-white opacity-80 mt-1">{trip.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-48 md:h-64 overflow-hidden group">
      <img src={currentUrl} alt={trip?.name} className="w-full h-full object-cover" />

      {/* Overlay with trip info */}
      <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-6">
        <h1 className="text-3xl font-bold text-white">{trip?.name}</h1>
        {trip?.description && (
          <p className="text-sm text-white opacity-80 mt-1">{trip.description}</p>
        )}
      </div>

      {/* Photo navigation (only shown when multiple photos available) */}
      {hasMultiple && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-opacity-70 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Previous photo"
          >
            &#x2039;
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-opacity-70 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Next photo"
          >
            &#x203a;
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1">
            {allUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); onSelectPhoto?.(allUrls[i], i); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Unsplash attribution (required by Unsplash guidelines) */}
      {photoMetadata?.[currentIndex]?.photographer && (
        <a
          href={photoMetadata[currentIndex].photographerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-3 text-xs text-white opacity-60 hover:opacity-100"
        >
          Photo by {photoMetadata[currentIndex].photographer} on Unsplash
        </a>
      )}
    </div>
  );
}
