export default function POISearchBar({ categories, onSearch, isLoading }) {
  function handleChange(e) {
    onSearch(e.target.value);
  }

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-slate-200">
      <select
        onChange={handleChange}
        disabled={isLoading}
        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        defaultValue=""
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
