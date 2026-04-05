import { useState } from 'react';
import { useNominatim } from '../hooks/useNominatim';

// Props:
//   onSelect: ({ address, lat, lon }) => void  — called when user picks a result
//   defaultValue: string — optional pre-filled address text
//   placeholder: string — optional placeholder text
export default function AddressInput({ onSelect, defaultValue = '', placeholder = 'Search for an address...' }) {
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, search, clearResults } = useNominatim();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    search(value);
  };

  const handleSelect = (result) => {
    setQuery(result.display_name);
    setIsOpen(false);
    clearResults();
    onSelect({
      address: result.display_name,
      lat: result.lat,
      lon: result.lon,
    });
  };

  const handleBlur = () => {
    // Delay to allow click on result to register before hiding dropdown
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />

      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map((result) => (
            <li
              key={result.osm_id}
              onMouseDown={() => handleSelect(result)}
              className="px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-blue-50 border-b border-slate-100 last:border-0"
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
