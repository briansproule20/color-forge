/**
 * Local storage utilities for saving and retrieving color palettes
 */

export interface SavedPalette {
  id: string;
  name: string;
  description: string;
  colors: Array<{
    hex: string;
    name: string;
    role: string;
  }>;
  colorTheory: string;
  useCases: string[];
  category: 'classic' | 'modern' | 'seasonal' | 'brand' | 'nature' | 'custom';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'color-forge-palettes';

/**
 * Get all saved palettes from localStorage
 */
export function getSavedPalettes(): SavedPalette[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading palettes from localStorage:', error);
    return [];
  }
}

/**
 * Save a palette to localStorage
 */
export function savePalette(palette: Omit<SavedPalette, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = generateId();
  const now = new Date().toISOString();
  
  const savedPalette: SavedPalette = {
    ...palette,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const existingPalettes = getSavedPalettes();
  const updatedPalettes = [...existingPalettes, savedPalette];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPalettes));
    return id;
  } catch (error) {
    console.error('Error saving palette to localStorage:', error);
    throw new Error('Failed to save palette');
  }
}

/**
 * Update an existing palette
 */
export function updatePalette(id: string, updates: Partial<Omit<SavedPalette, 'id' | 'createdAt'>>): boolean {
  const palettes = getSavedPalettes();
  const index = palettes.findIndex(p => p.id === id);
  
  if (index === -1) return false;
  
  const updatedPalette = {
    ...palettes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  palettes[index] = updatedPalette;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
    return true;
  } catch (error) {
    console.error('Error updating palette in localStorage:', error);
    return false;
  }
}

/**
 * Delete a palette by ID
 */
export function deletePalette(id: string): boolean {
  const palettes = getSavedPalettes();
  const filteredPalettes = palettes.filter(p => p.id !== id);
  
  if (filteredPalettes.length === palettes.length) return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPalettes));
    return true;
  } catch (error) {
    console.error('Error deleting palette from localStorage:', error);
    return false;
  }
}

/**
 * Get a specific palette by ID
 */
export function getPaletteById(id: string): SavedPalette | null {
  const palettes = getSavedPalettes();
  return palettes.find(p => p.id === id) || null;
}

/**
 * Search palettes by name, description, or color theory
 */
export function searchPalettes(query: string): SavedPalette[] {
  const palettes = getSavedPalettes();
  const lowercaseQuery = query.toLowerCase();
  
  return palettes.filter(palette => 
    palette.name.toLowerCase().includes(lowercaseQuery) ||
    palette.description.toLowerCase().includes(lowercaseQuery) ||
    palette.colorTheory.toLowerCase().includes(lowercaseQuery) ||
    palette.colors.some(color => 
      color.name.toLowerCase().includes(lowercaseQuery) ||
      color.hex.toLowerCase().includes(lowercaseQuery)
    )
  );
}

/**
 * Get palettes by category
 */
export function getPalettesByCategory(category: SavedPalette['category']): SavedPalette[] {
  const palettes = getSavedPalettes();
  return palettes.filter(palette => palette.category === category);
}

/**
 * Export all palettes as JSON
 */
export function exportPalettes(): string {
  const palettes = getSavedPalettes();
  return JSON.stringify(palettes, null, 2);
}

/**
 * Import palettes from JSON
 */
export function importPalettes(jsonData: string): { success: number; errors: string[] } {
  try {
    const importedPalettes = JSON.parse(jsonData);
    
    if (!Array.isArray(importedPalettes)) {
      throw new Error('Invalid format: expected array of palettes');
    }
    
    const existingPalettes = getSavedPalettes();
    const errors: string[] = [];
    let successCount = 0;
    
    for (const palette of importedPalettes) {
      try {
        // Validate required fields
        if (!palette.name || !palette.colors || !Array.isArray(palette.colors)) {
          errors.push(`Invalid palette: ${palette.name || 'unnamed'}`);
          continue;
        }
        
        // Generate new ID to avoid conflicts
        const newId = generateId();
        const now = new Date().toISOString();
        
        const validPalette: SavedPalette = {
          id: newId,
          name: palette.name,
          description: palette.description || '',
          colors: palette.colors,
          colorTheory: palette.colorTheory || '',
          useCases: palette.useCases || [],
          category: palette.category || 'custom',
          createdAt: palette.createdAt || now,
          updatedAt: now,
        };
        
        existingPalettes.push(validPalette);
        successCount++;
      } catch (error) {
        errors.push(`Error importing palette: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (successCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPalettes));
    }
    
    return { success: successCount, errors };
  } catch (error) {
    return { 
      success: 0, 
      errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}

/**
 * Clear all saved palettes
 */
export function clearAllPalettes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing palettes from localStorage:', error);
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalPalettes: number;
  totalSize: number;
  categories: Record<string, number>;
} {
  const palettes = getSavedPalettes();
  const totalSize = new Blob([JSON.stringify(palettes)]).size;
  
  const categories = palettes.reduce((acc, palette) => {
    acc[palette.category] = (acc[palette.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalPalettes: palettes.length,
    totalSize,
    categories,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
