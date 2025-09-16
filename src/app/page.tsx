/**
 * Next.js Image Generation Template with Echo SDK
 *
 * This template demonstrates how to build an AI image generation app using:
 * - Echo SDK for authentication and token management
 * - AI SDK for OpenAI and Gemini image generation
 * - Next.js App Router for server-side rendering
 *
 * Key features:
 * 1. Authentication: Automatic login/logout with Echo SDK
 * 2. Image Generation: Support for both OpenAI and Gemini models
 * 3. Image Editing: Upload images and edit with AI prompts
 * 4. History: Persistent image gallery with download/copy actions
 * 5. Responsive Design: Works on desktop and mobile
 *
 * Usage Examples:
 * - Text-to-Image: "A beautiful sunset over mountains"
 * - Image Editing: Upload photo + "Make this black and white"
 * - Model Switching: Choose between GPT Image or Gemini Flash
 */

import { isSignedIn } from '@/echo';
import ImageGenerator from '@/components/image-generator';
import { EchoSignIn } from '@merit-systems/echo-next-sdk/client';

/**
 * Main application page
 *
 * Server component that checks authentication status and renders
 * either the sign-in page or the main image generation interface
 */
export default async function Home() {
  // Check authentication status using Echo SDK
  const _isSignedIn = await isSignedIn();

  // Main application interface
  return (
    <div className="flex flex-col h-screen p-2 sm:p-4 max-w-6xl mx-auto">
      {/* Main image generation interface */}
      <div className="relative">
        <ImageGenerator />

        {/* Overlay when not signed in */}
        {!_isSignedIn && (
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 flex items-center justify-center rounded-xl border border-gray-300">
            <EchoSignIn />
          </div>
        )}
      </div>
    </div>
  );
}
