"use client";

import { useState } from 'react';
import { usePalettes } from '@/hooks/usePalettes';
import { SavedPalette } from '@/lib/palette-storage';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PaletteManagerProps {}

export default function PaletteManager({}: PaletteManagerProps) {
  const {
    palettes,
    loading,
    error,
    deletePalette,
    getStorageStats
  } = usePalettes();

  const [selectedPalette, setSelectedPalette] = useState<SavedPalette | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Show all palettes without filtering
  const filteredPalettes = palettes;


  const handleDeletePalette = async (id: string) => {
    if (confirm('Are you sure you want to delete this palette?')) {
      await deletePalette(id);
    }
  };

  const handlePaletteClick = (palette: SavedPalette) => {
    setSelectedPalette(palette);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPalette(null);
  };

  const downloadPalette = (palette: SavedPalette) => {
    // Create CSS file with color variables
    let cssContent = `/* ${palette.name} - ${palette.description} */\n`;
    cssContent += `/* Color Theory: ${palette.colorTheory} */\n\n`;
    cssContent += `:root {\n`;
    
    palette.colors.forEach((color) => {
      const varName = color.role.toLowerCase().replace(/\s+/g, '-');
      cssContent += `  --${varName}: ${color.hex};\n`;
    });
    
    cssContent += `}\n\n`;
    cssContent += `/* Use Cases: ${palette.useCases.join(', ')} */\n`;

    const dataBlob = new Blob([cssContent], { type: 'text/css' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${palette.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_palette.css`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  };



  const stats = getStorageStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading palettes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎨 Palette Manager</h2>
          <p className="text-gray-600">
            {stats.totalPalettes} palettes saved • {(stats.totalSize / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>


      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Palettes Grid */}
      {filteredPalettes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No palettes found</h3>
          <p className="text-gray-600">
            Create your first palette to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPalettes.map((palette) => (
            <div
              key={palette.id}
              onClick={() => handlePaletteClick(palette)}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Palette Colors */}
              <div className="flex space-x-1 mb-3">
                {palette.colors.slice(0, 6).map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} - ${color.hex}`}
                  />
                ))}
                {palette.colors.length > 6 && (
                  <div className="w-8 h-8 rounded border border-gray-300 bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                    +{palette.colors.length - 6}
                  </div>
                )}
              </div>

              {/* Palette Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 truncate">{palette.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{palette.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{palette.category}</span>
                  <span>{palette.colors.length} colors</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPalette(palette);
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePalette(palette.id);
                  }}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Palette Modal */}
      {showModal && selectedPalette && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedPalette.name}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Palette Description */}
              <p className="text-gray-600 mb-6">{selectedPalette.description}</p>

              {/* Color Swatches */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Colors ({selectedPalette.colors.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedPalette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(color.hex)}
                      title={`Click to copy: ${color.hex}`}
                    >
                      <div
                        style={{ backgroundColor: color.hex }}
                        className="w-full h-20 rounded-lg shadow-sm transition-transform group-hover:scale-105 border border-gray-200"
                      />
                      <div className="mt-2 text-center">
                        <p className="font-medium text-gray-900 text-sm">{color.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
                        <p className="text-xs text-gray-400">{color.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Theory */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Color Theory</h4>
                <p className="text-gray-600">{selectedPalette.colorTheory}</p>
              </div>

              {/* Use Cases */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Use Cases</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedPalette.useCases.map((useCase, index) => (
                    <li key={index}>{useCase}</li>
                  ))}
                </ul>
              </div>

              {/* Palette Info */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                <span className="capitalize">{selectedPalette.category}</span>
                <span>Created: {new Date(selectedPalette.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
