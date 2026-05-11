export const readStorage = (key, fallback) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }

    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorage = (key, value) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

export const removeStorage = (key) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};
