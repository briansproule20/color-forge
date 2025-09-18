"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Poline } from 'poline';

interface Color {
  hex: string;
  name: string;
  role: string;
}

interface PolineColorPickerProps {
  colors: Color[];
  onColorsChange?: (colors: string[]) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

export default function PolineColorPicker({
  colors,
  onColorsChange,
  expanded = false,
  onToggleExpanded
}: PolineColorPickerProps) {
  const pickerRef = useRef<HTMLElement>(null);
  const [poline, setPoline] = useState<Poline | null>(null);
  const [isWebComponentLoaded, setIsWebComponentLoaded] = useState(false);

  // Load the poline picker web component
  useEffect(() => {
    const loadPolinePicker = () => {
      // Check if custom element is already defined
      if (customElements.get('poline-picker')) {
        setIsWebComponentLoaded(true);
        return;
      }

      // Create and load the script for poline picker
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/node_modules/poline/dist/picker.mjs';
      script.onload = () => {
        setIsWebComponentLoaded(true);
      };
      script.onerror = (error) => {
        console.error('Failed to load poline picker:', error);
        // Fallback to CDN
        const fallbackScript = document.createElement('script');
        fallbackScript.type = 'module';
        fallbackScript.innerHTML = `
          import { Poline, PolinePicker } from 'https://unpkg.com/poline/dist/picker.mjs';
          window.Poline = Poline;
        `;
        fallbackScript.onload = () => setIsWebComponentLoaded(true);
        document.head.appendChild(fallbackScript);
      };

      document.head.appendChild(script);
    };

    if (expanded && !isWebComponentLoaded) {
      loadPolinePicker();
    }
  }, [expanded, isWebComponentLoaded]);

  // Initialize poline with colors from props
  useEffect(() => {
    if (colors.length >= 2) {
      // Convert first few colors to HSL for anchor points
      const anchorColors = colors.slice(0, Math.min(colors.length, 4)).map(color =>
        hexToHsl(color.hex)
      );

      const newPoline = new Poline({
        anchorColors,
        numPoints: Math.max(2, Math.floor(colors.length / anchorColors.length))
      });

      setPoline(newPoline);
    }
  }, [colors]);

  // Set up the poline picker when both web component and poline are ready
  useEffect(() => {
    if (!poline || !pickerRef.current || !isWebComponentLoaded || !expanded) return;

    const picker = pickerRef.current as HTMLElement & {
      setPoline?: (poline: Poline) => void;
      addEventListener: (event: string, handler: (event: CustomEvent) => void) => void;
      removeEventListener: (event: string, handler: (event: CustomEvent) => void) => void;
    };

    // Set the poline instance on the picker
    if (picker.setPoline) {
      picker.setPoline(poline);
    }

    // Listen for changes from the picker
    const handlePolineChange = (event: CustomEvent) => {
      const updatedPoline = (event.detail as { poline: Poline }).poline;
      if (onColorsChange) {
        onColorsChange(updatedPoline.colorsCSS);
      }
    };

    picker.addEventListener('poline-change', handlePolineChange);

    return () => {
      picker.removeEventListener('poline-change', handlePolineChange);
    };
  }, [poline, isWebComponentLoaded, expanded, onColorsChange]);

  if (!expanded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Color Playground</h3>
          <button
            onClick={onToggleExpanded}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🎨 Expand Playground
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          Open the interactive Poline color picker to explore and modify your palette in 3D color space.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">🎨 Poline Color Playground</h3>
        <button
          onClick={onToggleExpanded}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          ✕ Collapse
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Poline Picker Web Component */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Color Space Visualization</h4>
            {isWebComponentLoaded ? (
              React.createElement('poline-picker', {
                ref: pickerRef,
                interactive: true,
                'allow-add-points': true,
                style: {
                  width: '400px',
                  height: '400px',
                  maxWidth: '100%',
                  display: 'block',
                  margin: '0 auto'
                }
              })
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading Poline Picker...</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Drag anchor points and click empty areas to add new points
            </p>
          </div>
        </div>

        {/* Generated Colors */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Generated Palette</h4>
            {poline && (
              <div className="grid grid-cols-4 gap-2">
                {poline.colorsCSS.map((color, index) => (
                  <div key={index} className="group">
                    <div
                      style={{ backgroundColor: color }}
                      className="w-full h-12 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => navigator.clipboard.writeText(color)}
                      title={`Click to copy: ${color}`}
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate">{color}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Controls</h4>
            {poline && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points between anchors: {poline.numPoints}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={poline.numPoints}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      poline.numPoints = newValue;
                      if (pickerRef.current && (pickerRef.current as HTMLElement & { setPoline?: (poline: Poline) => void }).setPoline) {
                        (pickerRef.current as HTMLElement & { setPoline: (poline: Poline) => void }).setPoline(poline);
                      }
                      if (onColorsChange) {
                        onColorsChange(poline.colorsCSS);
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="closed-loop"
                    checked={poline.closedLoop}
                    onChange={(e) => {
                      poline.closedLoop = e.target.checked;
                      if (pickerRef.current && (pickerRef.current as HTMLElement & { setPoline?: (poline: Poline) => void }).setPoline) {
                        (pickerRef.current as HTMLElement & { setPoline: (poline: Poline) => void }).setPoline(poline);
                      }
                      if (onColorsChange) {
                        onColorsChange(poline.colorsCSS);
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="closed-loop" className="text-sm text-gray-700">
                    Closed loop palette
                  </label>
                </div>

                <button
                  onClick={() => {
                    poline.shiftHue(30);
                    if (pickerRef.current && (pickerRef.current as any).setPoline) {
                      (pickerRef.current as any).setPoline(poline);
                    }
                    if (onColorsChange) {
                      onColorsChange(poline.colorsCSS);
                    }
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                >
                  Shift Hue +30°
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 How to use</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag anchor points to explore different color combinations</li>
          <li>• Click empty areas to add new anchor points</li>
          <li>• Adjust points between anchors to get more or fewer colors</li>
          <li>• Enable closed loop to connect the first and last colors</li>
          <li>• Use hue shift to explore variations of your palette</li>
          <li>• Click any color to copy its value to clipboard</li>
        </ul>
      </div>
    </div>
  );
}