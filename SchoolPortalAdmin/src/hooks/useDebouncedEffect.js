import { useEffect, useRef } from 'react';

/**
 * Custom hook that debounces useEffect calls to prevent rapid successive executions
 * @param {Function} callback - The function to execute
 * @param {Array} dependencies - The dependency array for useEffect
 * @param {number} delay - The debounce delay in milliseconds (default: 100)
 */
const useDebouncedEffect = (callback, dependencies, delay = 100) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout to debounce the callback
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
};

export default useDebouncedEffect;

