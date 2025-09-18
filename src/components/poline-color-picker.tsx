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
  onColorsChange?: (colors: string[]) => void;
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
  onColorsChange,
  expanded = false,
  onToggleExpanded
}: PolineColorPickerProps) {
  const [poline, setPoline] = useState<Poline | null>(null);
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

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

  // Load the poline picker when expanded
  useEffect(() => {
    if (!expanded) return;

    const container = pickerContainerRef.current;
    if (!container) return;

    // Load the web component script
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import { Poline, PolinePicker } from 'https://unpkg.com/poline/dist/picker.mjs';
      
      const container = document.querySelector('[data-poline-container]');
      if (container && !container.querySelector('poline-picker')) {
        const picker = document.createElement('poline-picker');
        picker.setAttribute('interactive', '');
        picker.setAttribute('allow-add-points', '');
        picker.style.cssText = 'width: 100%; height: 100%; display: block;';
        
        container.innerHTML = '';
        container.appendChild(picker);
        
        // Set initial poline if available
        if (window.initialPoline) {
          picker.setPoline(window.initialPoline);
        }
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('poline-picker-ready', { detail: { picker } }));
      }
    `;
    
    container.setAttribute('data-poline-container', 'true');
    (window as any).initialPoline = poline;
    
    document.head.appendChild(script);

    const handleReady = (event: any) => {
      pickerRef.current = event.detail.picker;
      setPickerLoaded(true);
    };

    window.addEventListener('poline-picker-ready', handleReady, { once: true });

    return () => {
      window.removeEventListener('poline-picker-ready', handleReady);
      setPickerLoaded(false);
    };
  }, [expanded, poline]);

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
            />
            <p className="text-xs text-gray-500 mt-2">
              Drag the anchor points to modify colors in 3D space
            </p>
          </div>
        </div>

        {/* Generated Colors */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Generated Palette</h4>
            {poline && (
              <div className="grid grid-cols-4 gap-2">
                {poline.colors.map((color, index) => {
                  const hexColor = formatHex({
                    mode: 'hsl',
                    h: color[0],
                    s: color[1],
                    l: color[2]
                  });
                  return (
                    <div key={index} className="group">
                      <div
                        style={{ backgroundColor: hexColor }}
                        className="w-full h-12 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => navigator.clipboard.writeText(hexColor)}
                        title={`Click to copy: ${hexColor}`}
                      />
                      <p className="text-xs text-gray-500 mt-1 font-mono truncate">{hexColor}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}