import { openai } from "@/echo";
import { convertToModelMessages, streamText } from "ai";

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openai("gpt-5"),
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}