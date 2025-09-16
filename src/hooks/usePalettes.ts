/**
 * React hook for managing color palettes with local storage
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  SavedPalette, 
  getSavedPalettes, 
  savePalette, 
  updatePalette, 
  deletePalette, 
  getPaletteById,
  searchPalettes,
  getPalettesByCategory,
  exportPalettes,
  importPalettes,
  clearAllPalettes,
  getStorageStats
} from '@/lib/palette-storage';

export function usePalettes() {
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load palettes on mount
  useEffect(() => {
    try {
      const savedPalettes = getSavedPalettes();
      setPalettes(savedPalettes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load palettes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a new palette
  const saveNewPalette = useCallback((paletteData: Omit<SavedPalette, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = savePalette(paletteData);
      const newPalette = getPaletteById(id);
      if (newPalette) {
        setPalettes(prev => [...prev, newPalette]);
      }
      setError(null);
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save palette';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update an existing palette
  const updateExistingPalette = useCallback((id: string, updates: Partial<Omit<SavedPalette, 'id' | 'createdAt'>>) => {
    try {
      const success = updatePalette(id, updates);
      if (success) {
        setPalettes(prev => 
          prev.map(palette => 
            palette.id === id 
              ? { ...palette, ...updates, updatedAt: new Date().toISOString() }
              : palette
          )
        );
        setError(null);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update palette';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Delete a palette
  const removePalette = useCallback((id: string) => {
    try {
      const success = deletePalette(id);
      if (success) {
        setPalettes(prev => prev.filter(palette => palette.id !== id));
        setError(null);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete palette';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Search palettes
  const search = useCallback((query: string) => {
    try {
      return searchPalettes(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    }
  }, []);

  // Get palettes by category
  const getByCategory = useCallback((category: SavedPalette['category']) => {
    try {
      return getPalettesByCategory(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter by category');
      return [];
    }
  }, []);

  // Export palettes
  const exportData = useCallback(() => {
    try {
      return exportPalettes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      return '';
    }
  }, []);

  // Import palettes
  const importData = useCallback((jsonData: string) => {
    try {
      const result = importPalettes(jsonData);
      if (result.success > 0) {
        // Reload palettes after import
        const updatedPalettes = getSavedPalettes();
        setPalettes(updatedPalettes);
      }
      setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      return { success: 0, errors: [errorMessage] };
    }
  }, []);

  // Clear all palettes
  const clearAll = useCallback(() => {
    try {
      clearAllPalettes();
      setPalettes([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear palettes');
    }
  }, []);

  // Get storage statistics
  const getStats = useCallback(() => {
    try {
      return getStorageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get statistics');
      return { totalPalettes: 0, totalSize: 0, categories: {} };
    }
  }, []);

  // Refresh palettes from storage
  const refresh = useCallback(() => {
    try {
      const savedPalettes = getSavedPalettes();
      setPalettes(savedPalettes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh palettes');
    }
  }, []);

  return {
    palettes,
    loading,
    error,
    savePalette: saveNewPalette,
    updatePalette: updateExistingPalette,
    deletePalette: removePalette,
    searchPalettes: search,
    getPalettesByCategory: getByCategory,
    exportPalettes: exportData,
    importPalettes: importData,
    clearAllPalettes: clearAll,
    getStorageStats: getStats,
    refresh,
  };
}
