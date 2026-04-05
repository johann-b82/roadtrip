const CATEGORY_ICONS = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍺',
  fast_food: '🍔',
  hotel: '🏨',
  motel: '🏨',
  camp_site: '⛺',
  caravan_site: '🚐',
  attraction: '⭐',
  museum: '🏛️',
  viewpoint: '👀',
  park: '🌳',
  nature_reserve: '🌲',
  beach_resort: '🏖️',
  fuel: '⛽',
  supermarket: '🛒',
  pharmacy: '💊',
  atm: '🏧',
  other: '📍',
};

function truncate(str, max) {
  if (!str) return str;
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function POICard({ poi }) {
  const icon = CATEGORY_ICONS[poi.category] || '📍';

  // Build wikimedia image URL if available
  let imageUrl = poi.image_url;
  if (!imageUrl && poi.wikimedia_commons) {
    const filename = poi.wikimedia_commons.replace('File:', '');
    imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=200`;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      {/* Image thumbnail */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={poi.name}
          className="h-16 w-full object-cover rounded mb-2"
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Top row: icon, name, category badge */}
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-slate-800 block truncate">{poi.name}</span>
        </div>
        <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full text-slate-600 flex-shrink-0 capitalize">
          {poi.category || 'other'}
        </span>
      </div>

      {/* Details */}
      <div className="mt-1.5 space-y-0.5">
        {poi.cuisine && (
          <p className="text-xs text-slate-600">
            <span className="text-slate-400">Cuisine:</span> {capitalize(poi.cuisine)}
          </p>
        )}
        {poi.opening_hours && (
          <p className="text-xs text-slate-600">
            <span className="text-slate-400">Hours:</span> {poi.opening_hours}
          </p>
        )}
        {poi.phone && (
          <p className="text-xs text-slate-600">
            <span className="text-slate-400">Phone:</span> {poi.phone}
          </p>
        )}
        {poi.website && (
          <p className="text-xs text-slate-600">
            <span className="text-slate-400">Web:</span>{' '}
            <a
              href={poi.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {truncate(poi.website.replace(/^https?:\/\//, ''), 30)}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
