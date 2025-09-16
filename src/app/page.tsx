/**
 * ColorForge - AI-Powered Color Palette Generator with Poline
 *
 * This app demonstrates how to build an AI color palette generator using:
 * - Echo SDK for authentication and token management
 * - AI SDK for structured palette generation from text and images
 * - Poline for interactive color playground
 * - Culori for advanced color space conversions
 * - Next.js App Router for server-side rendering
 *
 * Key features:
 * 1. Authentication: Automatic login/logout with Echo SDK
 * 2. AI Palette Generation: Create palettes from text descriptions or images
 * 3. Interactive Poline Playground: Modify palettes with position functions
 * 4. Color Theory: Applied principles for balanced, harmonious palettes
 * 5. Copy-to-Clipboard: Easy hex code copying
 * 6. Responsive Design: Works on desktop and mobile
 *
 * Usage Examples:
 * - Text: "sunset over ocean" → Warm palette with orange/pink/blue
 * - Text: "modern tech startup" → Clean palette with blues/grays
 * - Image: Upload photo → Extract dominant colors and create palette
 * - Playground: Adjust position functions to explore color variations
 */

import { isSignedIn } from '@/echo';
import ColorForge from '@/components/color-forge';
import { EchoSignIn } from '@merit-systems/echo-next-sdk/client';

/**
 * Main application page
 *
 * Server component that checks authentication status and renders
 * either the sign-in page or the ColorForge palette generator interface
 */
export default async function Home() {
  // Check authentication status using Echo SDK
  const _isSignedIn = await isSignedIn();

  // Main application interface
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ColorForge palette generator interface */}
      <div className="relative flex-1">
        <ColorForge />

        {/* Overlay when not signed in */}
        {!_isSignedIn && (
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <EchoSignIn />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
