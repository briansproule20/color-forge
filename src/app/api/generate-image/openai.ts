/**
 * OpenAI image generation handler
 */

import { openai } from '@/echo';
import { experimental_generateImage as generateImage } from 'ai';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Handles OpenAI image generation
 */
export async function handleOpenAIGenerate(prompt: string): Promise<Response> {
  try {
    // Enhance prompt for color palette visualization
    const enhancedPrompt = `Create a beautiful color palette visualization: ${prompt}. Design this as a clean, modern color palette display with color swatches, showing the harmony and relationship between colors. Include color names or hex codes if relevant. Style: minimalist, professional color palette design.`;

    const result = await generateImage({
      model: openai.image('gpt-image-1'),
      prompt: enhancedPrompt,
    });

    const imageData = result.image;
    return Response.json({
      imageUrl: `data:${imageData.mediaType};base64,${imageData.base64}`,
    });
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.NO_IMAGE_GENERATED,
      },
      { status: 500 }
    );
  }
}
