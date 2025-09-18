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
  const [invertLightness, setInvertLightness] = useState(false);
  const [closedLoop, setClosedLoop] = useState(false);
  const [positionFunctionX, setPositionFunctionX] = useState('linearPosition');
  const [positionFunctionY, setPositionFunctionY] = useState('linearPosition');
  const [positionFunctionZ, setPositionFunctionZ] = useState('linearPosition');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to update the poline palette display using culori
  const updatePolineDisplay = (polineColors: [number, number, number][]) => {
    console.log('updatePolineDisplay called with:', polineColors);
    const colorsDisplay = document.getElementById('poline-colors-display');
    console.log('Found display element:', !!colorsDisplay);
    if (colorsDisplay && polineColors.length > 0) {
      // Show ALL colors from the poline picker (up to 24 max for display)
      const displayColors = polineColors.slice(0, Math.min(24, polineColors.length));
      
      // Calculate dynamic width based on number of colors - FIXED CONTAINER, NO GAPS
      const containerWidth = 500; // Fixed container width
      const swatchWidth = Math.floor(containerWidth / displayColors.length);
      const minWidth = 10; // Much smaller minimum for many colors
      const maxWidth = 100; // Maximum swatch width
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, swatchWidth));
      
      colorsDisplay.innerHTML = displayColors.map((color, index) => {
        // Use culori to convert HSL to hex
        let hexColor;
        try {
          hexColor = formatHex({
            mode: 'hsl',
            h: color[0],
            s: color[1],
            l: color[2]
          });
          if (!hexColor || hexColor === '#000000') {
            // Fallback if culori fails
            hexColor = `hsl(${color[0]}, ${color[1] * 100}%, ${color[2] * 100}%)`;
          }
        } catch (e) {
          console.error('Color conversion failed:', color, e);
          hexColor = `hsl(${color[0]}, ${color[1] * 100}%, ${color[2] * 100}%)`;
        }

        return `
          <div 
            class="cursor-pointer flex-shrink-0 relative group" 
            style="width: ${finalWidth}px; height: 96px; background-color: ${hexColor};" 
            onclick="
              navigator.clipboard.writeText('${hexColor}');
              
              // Create and show copy notification
              const notification = document.createElement('div');
              notification.textContent = 'Copied!';
              notification.className = 'absolute inset-0 bg-black bg-opacity-75 text-white text-xs font-mono flex items-center justify-center z-10';
              this.appendChild(notification);
              
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              }, 1000);
            "
            title="${hexColor}"
          >
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
      console.log('Received message:', event.data);
      if (event.data.type === 'poline-colors-update') {
        const polineColors = event.data.polineColors; // Raw HSL array from poline
        console.log('Poline colors received:', polineColors);
        setCurrentPolineColors(polineColors);
        updatePolineDisplay(polineColors);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [numSteps]);

  // Update display when colors change
  useEffect(() => {
    if (currentPolineColors.length > 0) {
      updatePolineDisplay(currentPolineColors);
    }
  }, [currentPolineColors]);

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
            <div id="poline-colors-display" className="flex flex-wrap justify-center w-full h-24 overflow-hidden" style={{width: '500px', margin: '0 auto'}}>
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

            {/* Advanced Poline Controls */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">Advanced Controls</h5>
                <button
                  onClick={() => {
                    // Reset all controls to defaults
                    setNumSteps(5);
                    setInvertLightness(false);
                    setClosedLoop(false);
                    setPositionFunctionX('linearPosition');
                    setPositionFunctionY('linearPosition');
                    setPositionFunctionZ('linearPosition');
                    
                    // Clear current colors state
                    setCurrentPolineColors([]);
                    
                    // Clear the display immediately
                    const colorsDisplay = document.getElementById('poline-colors-display');
                    if (colorsDisplay) {
                      colorsDisplay.innerHTML = `
                        <p class="text-xs text-gray-500 col-span-full text-center py-4">
                          Colors will update as you interact with the poline picker above
                        </p>
                      `;
                    }
                    
                    // Send reset message to iframe with AI colors
                    if (iframeRef.current) {
                      if (colors.length > 0) {
                        // Reset to AI color positions
                        iframeRef.current.contentWindow?.postMessage({
                          type: 'reset-to-ai-colors',
                          colors: colors
                        }, '*');
                      } else {
                        // Fallback to defaults if no AI colors
                        iframeRef.current.contentWindow?.postMessage({
                          type: 'reset-to-defaults'
                        }, '*');
                      }
                    }
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors"
                >
                  Reset
                </button>
              </div>
              
              {/* Toggle Controls */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invertLightness}
                    onChange={(e) => {
                      setInvertLightness(e.target.checked);
                      if (iframeRef.current) {
                        iframeRef.current.contentWindow?.postMessage({
                          type: 'update-config',
                          config: { invertedLightness: e.target.checked }
                        }, '*');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Invert Lightness</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closedLoop}
                    onChange={(e) => {
                      setClosedLoop(e.target.checked);
                      if (iframeRef.current) {
                        iframeRef.current.contentWindow?.postMessage({
                          type: 'update-config',
                          config: { closedLoop: e.target.checked }
                        }, '*');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Closed Loop</span>
                </label>
              </div>

              {/* Position Functions */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  {/* X-axis Position Function */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position X
                    </label>
                    <select
                      value={positionFunctionX}
                      onChange={(e) => {
                        setPositionFunctionX(e.target.value);
                        if (iframeRef.current) {
                          iframeRef.current.contentWindow?.postMessage({
                            type: 'update-config',
                            config: { positionFunctionX: e.target.value }
                          }, '*');
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal (Default)</option>
                      <option value="asinusoidalPosition">Asinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>

                  {/* Y-axis Position Function */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position Y
                    </label>
                    <select
                      value={positionFunctionY}
                      onChange={(e) => {
                        setPositionFunctionY(e.target.value);
                        if (iframeRef.current) {
                          iframeRef.current.contentWindow?.postMessage({
                            type: 'update-config',
                            config: { positionFunctionY: e.target.value }
                          }, '*');
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal (Default)</option>
                      <option value="asinusoidalPosition">Asinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>

                  {/* Z-axis Position Function */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position Z
                    </label>
                    <select
                      value={positionFunctionZ}
                      onChange={(e) => {
                        setPositionFunctionZ(e.target.value);
                        if (iframeRef.current) {
                          iframeRef.current.contentWindow?.postMessage({
                            type: 'update-config',
                            config: { positionFunctionZ: e.target.value }
                          }, '*');
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal (Default)</option>
                      <option value="asinusoidalPosition">Asinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>
                    </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}