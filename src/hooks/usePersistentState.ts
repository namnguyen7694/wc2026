import { useState, useEffect } from "react";

/**
 * A custom hook to persist state in localStorage safely with Next.js SSR.
 * Postpones reading localStorage until after the component mounts (client-side),
 * preventing hydration mismatches between Server and Client HTML.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.error("Error reading localStorage key:", key, error);
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error setting localStorage key:", key, error);
    }
  };

  return [state, setValue, isLoaded];
}
