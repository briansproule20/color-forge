"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Poline, positionFunctions } from 'poline';
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
  const [currentXFunction, setCurrentXFunction] = useState('linearPosition');
  const [currentYFunction, setCurrentYFunction] = useState('linearPosition');
  const [currentZFunction, setCurrentZFunction] = useState('linearPosition');
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);


  // Initialize poline with colors from props
  useEffect(() => {
    if (colors.length >= 2) {
      // Use exactly 2 anchor points for stable dragging
      // But choose them better to represent the palette's range
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

      // Ensure anchor colors are different enough in hue space
      const hDiff = Math.abs(anchorColors[1][0] - anchorColors[0][0]);
      if (hDiff < 20) {
        // Spread them apart in hue if they're too close
        anchorColors[1][0] = (anchorColors[0][0] + 180) % 360;
      }

      console.log('Creating poline with 2 anchor colors:', anchorColors);

      // Default steps: total colors minus 2 anchor points
      const defaultSteps = Math.max(1, Math.min(10, colors.length - 2));

      const newPoline = new Poline({
        anchorColors,
        numPoints: defaultSteps
      });

      setPoline(newPoline);
    }
  }, [colors]);

  // Load the poline picker when expanded
  useEffect(() => {
    if (!expanded || pickerLoaded) return;

    const loadPicker = async () => {
      try {
        // Load the poline picker module script (only once)
        if (!document.querySelector('script[data-poline-module]')) {
          const moduleScript = document.createElement('script');
          moduleScript.type = 'module';
          moduleScript.setAttribute('data-poline-module', 'true');
          moduleScript.textContent = `
            import { Poline, PolinePicker } from 'https://unpkg.com/poline/dist/picker.mjs';
            window.Poline = Poline;
            window.PolinePicker = PolinePicker;
            window.dispatchEvent(new CustomEvent('poline-module-loaded'));
          `;
          document.head.appendChild(moduleScript);
        }

        // Listen for module to load
        const handleModuleLoaded = () => {
          const container = document.getElementById('poline-picker-container');
          if (container && !container.querySelector('poline-picker')) {
            // Create the picker element
            const picker = document.createElement('poline-picker');
            picker.id = 'picker';
            picker.setAttribute('interactive', '');
            picker.setAttribute('allow-add-points', '');
            picker.style.width = '100%';
            picker.style.height = '100%';
            picker.style.display = 'block';

            // Clear loading content safely and add picker
            container.innerHTML = '';
            container.appendChild(picker);

            // Set the poline if available
            if (poline) {
              picker.setPoline(poline);
            }

            // Listen for poline changes
            picker.addEventListener('poline-change', (event) => {
              const updatedPoline = event.detail.poline;
              setPoline(updatedPoline);

              if (onColorsChange) {
                const hexColors = updatedPoline.colors.map(color => {
                  try {
                    return formatHex({
                      mode: 'hsl',
                      h: color[0],
                      s: color[1],
                      l: color[2]
                    });
                  } catch {
                    return '#000000';
                  }
                });
                onColorsChange(hexColors);
              }
            });

            setPickerLoaded(true);
          }
        };

        if (window.Poline && window.PolinePicker) {
          handleModuleLoaded();
        } else {
          window.addEventListener('poline-module-loaded', handleModuleLoaded, { once: true });
        }

      } catch (error) {
        console.error('Failed to load poline picker:', error);
      }
    };

    loadPicker();
  }, [expanded, poline, pickerLoaded, onColorsChange]);

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
            <div
              id="poline-picker-container"
              ref={pickerContainerRef}
              style={{
                width: '400px',
                height: '400px',
                maxWidth: '100%',
                margin: '0 auto',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {!pickerLoaded && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading Color Wheel...</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Drag the anchor points (edge nodes) to modify colors in 3D space
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

          {/* Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Controls</h4>
            {poline && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steps: {poline.numPoints} (Total colors: {poline.numPoints + 2})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={poline.numPoints}
                    onChange={(e) => {
                      const steps = parseInt(e.target.value);
                      console.log('Changing steps to:', steps);

                      try {
                        // Create a new poline with the same anchor points but different numPoints
                        const PolineClass = (window as any).Poline;
                        if (!PolineClass) {
                          console.error('Poline class not available');
                          return;
                        }

                        const anchorColors = poline.anchorPoints.map(p => [p.hsl[0], p.hsl[1], p.hsl[2]]);
                        console.log('Using anchor colors:', anchorColors);

                        const newPoline = new PolineClass({
                          anchorColors,
                          numPoints: steps,
                          positionFunctionX: (window as any).positionFunctions?.[currentXFunction],
                          positionFunctionY: (window as any).positionFunctions?.[currentYFunction],
                          positionFunctionZ: (window as any).positionFunctions?.[currentZFunction],
                          closedLoop: poline.closedLoop,
                          invertedLightness: poline.invertedLightness
                        });

                        console.log('Created new poline with', newPoline.colors.length, 'colors');
                        setPoline(newPoline);

                        if (pickerRef.current) {
                          pickerRef.current.setPoline(newPoline);
                        }

                        if (onColorsChange) {
                          const hexColors = newPoline.colors.map(color =>
                            formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                          );
                          onColorsChange(hexColors);
                        }
                      } catch (error) {
                        console.error('Error updating steps:', error);
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 step (3 colors)</span>
                    <span>10 steps (12 colors)</span>
                  </div>
                </div>


                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">X-Axis</label>
                    <select
                      value={currentXFunction}
                      onChange={(e) => {
                        const functionName = e.target.value;
                        console.log('Changing X function to:', functionName);
                        const positionFunctions = (window as any).positionFunctions;
                        const positionFunction = positionFunctions?.[functionName];

                        if (positionFunction && poline) {
                          try {
                            const PolineClass = (window as any).Poline;
                            const newPoline = new PolineClass({
                              anchorColors: poline.anchorPoints.map(p => [p.hsl[0], p.hsl[1], p.hsl[2]]),
                              numPoints: poline.numPoints,
                              positionFunctionX: positionFunction,
                              positionFunctionY: (window as any).positionFunctions?.[currentYFunction],
                              positionFunctionZ: (window as any).positionFunctions?.[currentZFunction],
                              closedLoop: poline.closedLoop,
                              invertedLightness: poline.invertedLightness
                            });

                            setPoline(newPoline);
                            setCurrentXFunction(functionName);

                            if (pickerRef.current) {
                              pickerRef.current.setPoline(newPoline);
                            }

                            if (onColorsChange) {
                              const hexColors = newPoline.colors.map(color =>
                                formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                              );
                              onColorsChange(hexColors);
                            }
                          } catch (error) {
                            console.error('Error updating X function:', error);
                          }
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal</option>
                      <option value="asinusoidalPosition">A-Sinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis</label>
                    <select
                      value={currentYFunction}
                      onChange={(e) => {
                        const functionName = e.target.value;
                        console.log('Changing Y function to:', functionName);
                        const positionFunctions = (window as any).positionFunctions;
                        const positionFunction = positionFunctions?.[functionName];

                        if (positionFunction && poline) {
                          try {
                            const PolineClass = (window as any).Poline;
                            const newPoline = new PolineClass({
                              anchorColors: poline.anchorPoints.map(p => [p.hsl[0], p.hsl[1], p.hsl[2]]),
                              numPoints: poline.numPoints,
                              positionFunctionX: (window as any).positionFunctions?.[currentXFunction],
                              positionFunctionY: positionFunction,
                              positionFunctionZ: (window as any).positionFunctions?.[currentZFunction],
                              closedLoop: poline.closedLoop,
                              invertedLightness: poline.invertedLightness
                            });

                            setPoline(newPoline);
                            setCurrentYFunction(functionName);

                            if (pickerRef.current) {
                              pickerRef.current.setPoline(newPoline);
                            }

                            if (onColorsChange) {
                              const hexColors = newPoline.colors.map(color =>
                                formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                              );
                              onColorsChange(hexColors);
                            }
                          } catch (error) {
                            console.error('Error updating Y function:', error);
                          }
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal</option>
                      <option value="asinusoidalPosition">A-Sinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Z-Axis</label>
                    <select
                      value={currentZFunction}
                      onChange={(e) => {
                        const functionName = e.target.value;
                        console.log('Changing Z function to:', functionName);
                        const positionFunctions = (window as any).positionFunctions;
                        const positionFunction = positionFunctions?.[functionName];

                        if (positionFunction && poline) {
                          try {
                            const PolineClass = (window as any).Poline;
                            const newPoline = new PolineClass({
                              anchorColors: poline.anchorPoints.map(p => [p.hsl[0], p.hsl[1], p.hsl[2]]),
                              numPoints: poline.numPoints,
                              positionFunctionX: (window as any).positionFunctions?.[currentXFunction],
                              positionFunctionY: (window as any).positionFunctions?.[currentYFunction],
                              positionFunctionZ: positionFunction,
                              closedLoop: poline.closedLoop,
                              invertedLightness: poline.invertedLightness
                            });

                            setPoline(newPoline);
                            setCurrentZFunction(functionName);

                            if (pickerRef.current) {
                              pickerRef.current.setPoline(newPoline);
                            }

                            if (onColorsChange) {
                              const hexColors = newPoline.colors.map(color =>
                                formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                              );
                              onColorsChange(hexColors);
                            }
                          } catch (error) {
                            console.error('Error updating Z function:', error);
                          }
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="linearPosition">Linear</option>
                      <option value="exponentialPosition">Exponential</option>
                      <option value="quadraticPosition">Quadratic</option>
                      <option value="cubicPosition">Cubic</option>
                      <option value="quarticPosition">Quartic</option>
                      <option value="sinusoidalPosition">Sinusoidal</option>
                      <option value="asinusoidalPosition">A-Sinusoidal</option>
                      <option value="arcPosition">Arc</option>
                      <option value="smoothStepPosition">Smooth Step</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="closed-loop"
                    checked={poline.closedLoop}
                    onChange={(e) => {
                      poline.closedLoop = e.target.checked;
                      if (pickerRef.current) {
                        pickerRef.current.setPoline(poline);
                      }
                      if (onColorsChange) {
                        const hexColors = poline.colors.map(color =>
                          formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                        );
                        onColorsChange(hexColors);
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="closed-loop" className="text-sm text-gray-700">
                    Closed loop palette
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inverted-lightness"
                    checked={poline.invertedLightness}
                    onChange={(e) => {
                      poline.invertedLightness = e.target.checked;
                      if (pickerRef.current) {
                        pickerRef.current.setPoline(poline);
                      }
                      if (onColorsChange) {
                        const hexColors = poline.colors.map(color =>
                          formatHex({ mode: 'hsl', h: color[0], s: color[1], l: color[2] })
                        );
                        onColorsChange(hexColors);
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="inverted-lightness" className="text-sm text-gray-700">
                    Inverted lightness
                  </label>
                </div>

                <button
                  onClick={() => {
                    poline.shiftHue(30);
                    if (pickerRef.current) {
                      pickerRef.current.setPoline(poline);
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

    </div>
  );
}