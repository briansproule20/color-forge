import { openai, getEchoToken, isSignedIn } from "@/echo";
import { generateObject } from "ai";
import { z } from "zod";

const createPaletteSchema = (numColors: number) => z.object({
  name: z.string().describe("A creative name for the color palette"),
  description: z.string().describe("Brief description of the palette and its mood"),
  colors: z.array(z.object({
    hex: z.string().describe("Hex color code like #FF5733"),
    name: z.string().describe("Descriptive name for this color"),
    role: z.string().describe("Role in the palette (primary, secondary, accent, etc.)")
  })).length(numColors).describe(`Array of exactly ${numColors} colors in the palette`),
  colorTheory: z.string().describe("The color theory principle used (complementary, analogous, etc.)"),
  useCases: z.array(z.string()).describe("Suggested use cases for this palette")
});

export async function POST(req: Request) {
  try {
    console.log('=== Palette Generation Request ===');
    console.log('ECHO_APP_ID available:', !!process.env.ECHO_APP_ID);
    console.log('ECHO_APP_ID value:', process.env.ECHO_APP_ID?.substring(0, 8) + '...');

    // Check authentication status
    const signedIn = await isSignedIn();
    console.log('User signed in:', signedIn);

    if (!signedIn) {
      console.log('User not signed in, returning 401');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get and log token info
    try {
      const token = await getEchoToken();
      console.log('Echo token available:', !!token);
      console.log('Token type:', typeof token);
      if (token && typeof token === 'string') {
        console.log('Token length:', token.length);
        console.log('Token starts with:', token.substring(0, 20) + '...');
      }
    } catch (tokenError) {
      console.error('Error getting Echo token:', tokenError);
    }

    const contentType = req.headers.get('content-type');
    let prompt = '';
    let numColors = 5; // Default value

    console.log('Content-Type:', contentType);

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with potential image
      const formData = await req.formData();
      prompt = formData.get('prompt') as string || '';
      numColors = parseInt(formData.get('numColors') as string) || 5;
      const imageFile = formData.get('image') as File;

      if (imageFile && imageFile.size > 0) {
        console.log('Processing image:', imageFile.name, imageFile.size, 'bytes');
        
        // Convert image to base64 for vision model
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const result = await generateObject({
          model: openai("gpt-4o"),
          system: `You are ColorForge AI, a master color palette designer. Create beautiful, harmonious color palettes based on images and text input using established color theory principles. When given an image, analyze its dominant colors, lighting, mood, and visual elements to create a cohesive palette.`,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt ? `Create a color palette with exactly ${numColors} colors based on this image: ${prompt}` : `Create a color palette with exactly ${numColors} colors based on this image, analyzing its dominant colors and mood.` },
                {
                  type: "image",
                  image: `data:${imageFile.type};base64,${base64}`
                }
              ]
            }
          ],
          schema: createPaletteSchema(numColors),
        });

        return Response.json(result.object);
      }
    } else {
      // Handle JSON request
      const body = await req.json();
      prompt = body.prompt;
      numColors = body.numColors || 5;
    }

    if (!prompt) {
      console.log('Error: No prompt provided');
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log('Generating palette for prompt:', prompt, 'with', numColors, 'colors');

    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `You are ColorForge AI, a master color palette designer. Create beautiful, harmonious color palettes based on user input using established color theory principles. Always provide practical, well-balanced palettes with clear color relationships.`,
      prompt: `Create a color palette with exactly ${numColors} colors for: ${prompt}`,
      schema: createPaletteSchema(numColors),
    });

    console.log('Generated palette successfully:', result.object.name);
    return Response.json(result.object);
  } catch (error) {
    console.error('Palette generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error type:', typeof error);
    console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'none');

    return new Response(
      JSON.stringify({
        error: 'Failed to generate palette. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}