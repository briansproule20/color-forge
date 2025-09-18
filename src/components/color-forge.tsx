"use client";

import { useState } from "react";
import PaletteManager from "./palette-manager";
import PolineColorPicker from "./poline-color-picker";
import { usePalettes } from "@/hooks/usePalettes";

interface Color {
  hex: string;
  name: string;
  role: string;
}

interface PaletteData {
  name: string;
  description: string;
  colors: Color[];
  colorTheory: string;
  useCases: string[];
}

export default function ColorForge() {
  const [prompt, setPrompt] = useState("");
  const [palette, setPalette] = useState<PaletteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  const [numColors, setNumColors] = useState(5);
  const [polineExpanded, setPolineExpanded] = useState(false);

  const { savePalette } = usePalettes();


  // Helper function to convert HSL CSS string to hex
  const hslToHex = (hslString: string): string => {
    // Parse HSL string like "hsl(120, 50%, 60%)"
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return hslString; // Return original if not HSL format

    const h = parseInt(match[1]);
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

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

    // Convert to 0-255 range and then to hex
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };


  const generatePalette = async () => {
    if (!prompt.trim() && !imageFile) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Generating palette with:', { prompt, imageFile: imageFile?.name, imageSize: imageFile?.size });
      
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("numColors", numColors.toString());
      if (imageFile) {
        formData.append("image", imageFile);
        console.log('Added image to form data:', imageFile.name, imageFile.size);
      }

      const response = await fetch("/api/generate-palette", {
        method: "POST",
        body: imageFile ? formData : JSON.stringify({ prompt, numColors }),
        headers: imageFile ? {} : { "Content-Type": "application/json" },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || "Failed to generate palette");
      }

      const data = await response.json();
      console.log('Generated palette:', data);
      setPalette(data);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveCurrentPalette = async () => {
    if (!palette) return;
    
    try {
      await savePalette({
        name: palette.name,
        description: palette.description,
        colors: palette.colors,
        colorTheory: palette.colorTheory,
        useCases: palette.useCases,
        category: 'custom'
      });
      alert('Palette saved successfully!');
    } catch {
      alert('Failed to save palette');
    }
  };



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          🎨 ColorForge
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered color palette generator with interactive Poline playground
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Generate Palette
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'manage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Palettes
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'generate' ? (
        <>
          {/* Input Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Generate Palette</h2>
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">
                  Colors: {numColors}
                </label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={numColors}
                  onChange={(e) => setNumColors(parseInt(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Describe your palette
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'sunset over ocean', 'cozy autumn cafe', 'modern tech startup'"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && generatePalette()}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Or upload an image
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreview && (
              <button
                onClick={clearImage}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            )}
          </div>
          {imagePreview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePalette}
          disabled={loading || (!prompt.trim() && !imageFile)}
          className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating..." : "Generate Palette"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Palette Display */}
      {palette && (
        <div className="space-y-8">
          {/* Palette Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{palette.name}</h2>
              <button
                onClick={saveCurrentPalette}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                💾 Save Palette
              </button>
            </div>
            <p className="text-gray-600">{palette.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {palette.colorTheory}
              </span>
              {palette.useCases.map((useCase, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {palette.colors.map((color, index) => (
                <div key={index} className="group cursor-pointer" onClick={() => copyToClipboard(color.hex)}>
                  <div
                    style={{ backgroundColor: color.hex }}
                    className="w-full h-24 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                  />
                  <div className="mt-2 text-center">
                    <p className="font-medium text-gray-900 text-sm">{color.name}</p>
                    <p className="text-xs text-gray-500">{color.hex}</p>
                    <p className="text-xs text-gray-400">{color.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Poline Color Picker Integration */}
          <PolineColorPicker
            colors={palette.colors}
            expanded={polineExpanded}
            onToggleExpanded={() => setPolineExpanded(!polineExpanded)}
          />
        </div>
      )}
        </>
      ) : (
        /* Manage Palettes Tab */
        <PaletteManager />
      )}
    </div>
  );
}