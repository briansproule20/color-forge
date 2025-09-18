"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Poline } from 'poline';
import { formatHex, hsl } from 'culori';

interface Color {
  hex: string;
  name: string;
  role: string;
}

interface PolineColorPickerProps {
  colors: Color[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

// Helper function to convert hex to HSL using culori
function hexToHsl(hex: string): [number, number, number] {
  const hslColor = hsl(hex);
  if (!hslColor) return [0, 0, 0.5];

  return [
    hslColor.h || 0,
    hslColor.s || 0,
    hslColor.l || 0.5
  ];
}

export default function PolineColorPicker({
  colors,
  expanded = false,
  onToggleExpanded
}: PolineColorPickerProps) {
  const [poline, setPoline] = useState<Poline | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize poline with colors from props
  useEffect(() => {
    if (colors.length >= 2) {
      const firstColor = hexToHsl(colors[0].hex);
      const middleIndex = Math.floor(colors.length / 2);
      const middleColor = hexToHsl(colors[middleIndex].hex);

      const anchorColors: [number, number, number][] = [
        [
          isNaN(firstColor[0]) ? 0 : firstColor[0],
          isNaN(firstColor[1]) ? 0.7 : Math.max(0.2, Math.min(1, firstColor[1])),
          isNaN(firstColor[2]) ? 0.5 : Math.max(0.2, Math.min(0.8, firstColor[2]))
        ],
        [
          isNaN(middleColor[0]) ? 180 : middleColor[0],
          isNaN(middleColor[1]) ? 0.7 : Math.max(0.2, Math.min(1, middleColor[1])),
          isNaN(middleColor[2]) ? 0.5 : Math.max(0.2, Math.min(0.8, middleColor[2]))
        ]
      ];

      const newPoline = new Poline({
        anchorColors,
        numPoints: Math.max(1, Math.min(10, colors.length - 2))
      });

      setPoline(newPoline);
    }
  }, [colors]);

  // Send colors to iframe when expanded and colors change
  useEffect(() => {
    if (expanded && iframeRef.current && colors.length > 0) {
      // Small delay to ensure iframe is ready
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'set-ai-colors',
          colors: colors
        }, '*');
      }, 500);
    }
  }, [colors, expanded]);

  // Listen for poline color updates to display in the poline palette section
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'poline-colors-update') {
        const colorsDisplay = document.getElementById('poline-colors-display');
        if (colorsDisplay) {
          // Convert HSL CSS strings to hex for display
          const colors = event.data.colors;
          colorsDisplay.innerHTML = colors.map((color: string, index: number) => {
            // Parse HSL string and convert to hex for display
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            let hexColor = color;
            
            if (hslMatch) {
              const h = parseInt(hslMatch[1]);
              const s = parseInt(hslMatch[2]) / 100;
              const l = parseInt(hslMatch[3]) / 100;

              // Convert HSL to RGB
              const c = (1 - Math.abs(2 * l - 1)) * s;
              const x = c * (1 - Math.abs((h / 60) % 2 - 1));
              const m = l - c / 2;

              let r = 0, g = 0, b = 0;

              if (0 <= h && h < 60) {
                r = c; g = x; b = 0;
              } else if (60 <= h && h < 120) {
                r = x; g = c; b = 0;
              } else if (120 <= h && h < 180) {
                r = 0; g = c; b = x;
              } else if (180 <= h && h < 240) {
                r = 0; g = x; b = c;
              } else if (240 <= h && h < 300) {
                r = x; g = 0; b = c;
              } else if (300 <= h && h < 360) {
                r = c; g = 0; b = x;
              }

              // Convert to hex
              const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
              const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
              const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

              hexColor = `#${rHex}${gHex}${bHex}`;
            }

            return `
              <div class="group">
                <div
                  style="background-color: ${hexColor}"
                  class="w-full h-12 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-transform group-hover:scale-105"
                  onclick="navigator.clipboard.writeText('${hexColor}')"
                  title="Click to copy: ${hexColor}"
                ></div>
                <p class="text-xs text-gray-500 mt-1 font-mono truncate">${hexColor}</p>
              </div>
            `;
          }).join('');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!expanded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Color Playground</h3>
          <button
            onClick={onToggleExpanded}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
          >
            🎨 Open Poline Playground
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
        {/* Poline Picker */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Color Space Visualization</h4>
            <iframe
              ref={iframeRef}
              src="/poline-picker.html"
              style={{
                width: '400px',
                height: '400px',
                maxWidth: '100%',
                margin: '0 auto',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}
              title="Poline Color Picker"
              onLoad={() => {
                // Send AI colors when iframe loads
                if (colors.length > 0) {
                  setTimeout(() => {
                    iframeRef.current?.contentWindow?.postMessage({
                      type: 'set-ai-colors',
                      colors: colors
                    }, '*');
                  }, 100);
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Drag the anchor points to modify colors in 3D space
            </p>
          </div>
        </div>

        {/* Poline Colors */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Poline Palette</h4>
            <div id="poline-colors-display" className="grid grid-cols-4 gap-2">
              <p className="text-xs text-gray-500 col-span-4 text-center py-4">
                Colors will update as you interact with the poline picker above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}