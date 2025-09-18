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
  const [numSteps, setNumSteps] = useState(5);
  const [currentPolineColors, setCurrentPolineColors] = useState<[number, number, number][]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to update the poline palette display using culori
  const updatePolineDisplay = (polineColors: [number, number, number][], steps: number) => {
    const colorsDisplay = document.getElementById('poline-colors-display');
    if (colorsDisplay && polineColors.length > 0) {
      // Show the exact number of colors specified by steps
      const displayColors = polineColors.slice(0, steps);
      
      // Calculate dynamic width based on number of colors
      // Container is max-w-2xl (672px), with gaps and padding
      const containerWidth = 640; // Approximate usable width
      const gapSpace = (displayColors.length - 1) * 8; // 8px gaps between items
      const availableWidth = containerWidth - gapSpace;
      const swatchWidth = Math.floor(availableWidth / displayColors.length);
      const minWidth = 60; // Minimum swatch width
      const maxWidth = 120; // Maximum swatch width
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, swatchWidth));
      
      colorsDisplay.innerHTML = displayColors.map((color, index) => {
        // Use culori to convert HSL to hex
        const hexColor = formatHex({
          mode: 'hsl',
          h: color[0],
          s: color[1],
          l: color[2]
        });

        return `
          <div class="group cursor-pointer flex-shrink-0" style="width: ${finalWidth}px" onclick="
            navigator.clipboard.writeText('${hexColor}');
            const elem = this.querySelector('p');
            const original = elem.textContent;
            elem.textContent = 'Copied!';
            elem.style.color = '#059669';
            setTimeout(() => {
              elem.textContent = original;
              elem.style.color = '#6b7280';
            }, 1000);
          ">
            <div
              style="background-color: ${hexColor}"
              class="w-full h-24 rounded-lg shadow-sm transition-transform group-hover:scale-105"
            ></div>
            <div class="mt-2 text-center">
              <p class="text-xs text-gray-500">${hexColor}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  };

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
        const polineColors = event.data.polineColors; // Raw HSL array from poline
        setCurrentPolineColors(polineColors);
        updatePolineDisplay(polineColors, numSteps);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [numSteps]);

  // Update display when numSteps changes
  useEffect(() => {
    if (currentPolineColors.length > 0) {
      updatePolineDisplay(currentPolineColors, numSteps);
    }
  }, [numSteps, currentPolineColors]);

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
                    // Request initial colors to populate the display
                    setTimeout(() => {
                      iframeRef.current?.contentWindow?.postMessage({
                        type: 'request-colors'
                      }, '*');
                    }, 200);
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
            <div id="poline-colors-display" className="flex flex-wrap justify-center gap-2 w-full max-w-2xl mx-auto min-h-[120px]">
              <p className="text-xs text-gray-500 col-span-full text-center py-4">
                Colors will update as you interact with the poline picker above
              </p>
            </div>
            
            {/* Steps Control */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Steps: {numSteps}
                </label>
                <span className="text-xs text-gray-500">
                  {numSteps === 2 ? 'Anchor points only' : `${numSteps} color palette`}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                value={numSteps}
                onChange={(e) => {
                  const newSteps = parseInt(e.target.value);
                  setNumSteps(newSteps);
                  // Send updated steps to iframe
                  if (iframeRef.current) {
                    iframeRef.current.contentWindow?.postMessage({
                      type: 'update-steps',
                      steps: newSteps
                    }, '*');
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>2</span>
                <span>7</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}