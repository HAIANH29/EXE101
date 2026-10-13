const FAVORITES_STORAGE_KEY = 'stylelock.favorites.ids';

type FavoriteListener = () => void;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function loadInitialFavorites(): Set<string> {
  const storage = getStorage();
  if (!storage) return new Set();

  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

let favoriteIds: Set<string> = loadInitialFavorites();
const listeners = new Set<FavoriteListener>();

function persistFavorites() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
  } catch {
    // Ignore storage write errors
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const favoritesStore = {
  isFavorite(id: string): boolean {
    return favoriteIds.has(id);
  },

  toggleFavorite(id: string): boolean {
    const nextState = !favoriteIds.has(id);
    if (nextState) {
      favoriteIds.add(id);
    } else {
      favoriteIds.delete(id);
    }
    persistFavorites();
    notifyListeners();
    return nextState;
  },

  subscribe(listener: FavoriteListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
