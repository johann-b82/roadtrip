import { create } from 'zustand';

// Trip store: no persist (server is source of truth; refetch on mount)
export const useTripStore = create((set) => ({
  trips: [],
  selectedTrip: null,
  stops: [],
  photoUrls: [],
  photoMetadata: [],
  isLoading: false,
  error: null,

  setTrips: (trips) => set({ trips }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setStops: (stops) => set({ stops }),
  setPhotoUrls: (photoUrls, photoMetadata) => set({ photoUrls, photoMetadata }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Update single trip in list (optimistic update helper)
  updateTripInList: (updatedTrip) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)),
      selectedTrip: state.selectedTrip?.id === updatedTrip.id ? updatedTrip : state.selectedTrip,
    })),

  // Remove trip from list
  removeTripFromList: (tripId) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== tripId),
      selectedTrip: state.selectedTrip?.id === tripId ? null : state.selectedTrip,
    })),

  // Update stop in stops list
  updateStopInList: (updatedStop) =>
    set((state) => ({
      stops: state.stops.map((s) => (s.id === updatedStop.id ? updatedStop : s)),
    })),

  // Remove stop from stops list
  removeStopFromList: (stopId) =>
    set((state) => ({
      stops: state.stops.filter((s) => s.id !== stopId),
    })),

  clearTrip: () => set({ selectedTrip: null, stops: [], photoUrls: [], photoMetadata: [] }),
}));
