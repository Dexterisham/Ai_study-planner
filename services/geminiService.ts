
import { GoogleGenAI, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export async function extractEquationsFromImages(
  images: string[],
  updateProgress: (message: string) => void
): Promise<string[]> {
  const equations: string[] = [];
  const MAX_CONCURRENT_REQUESTS = 5;
  let processedCount = 0;

  for (let i = 0; i < images.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = images.slice(i, i + MAX_CONCURRENT_REQUESTS);
    const promises = batch.map(base64Image => {
      const imagePart = {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      };
      const textPart = {
        text: "Extract the primary mathematical equation or expression from this image. Respond ONLY with the equation in valid LaTeX format, without any surrounding text or explanation. If there is no discernible math equation, respond with 'IGNORE'."
      };

      return ai.models.generateContent({
        model,
        contents: { parts: [imagePart, textPart] },
      }).then(response => {
        const text = response.text.trim();
        if (text && text !== 'IGNORE' && text.length > 2) {
          equations.push(text);
        }
        processedCount++;
        updateProgress(`Analyzing images with AI... (${processedCount}/${images.length})`);
      }).catch(err => {
        console.warn("Gemini API call failed for an image:", err);
        processedCount++;
        updateProgress(`Analyzing images with AI... (${processedCount}/${images.length})`);
      });
    });
    await Promise.all(promises);
  }
  
  // Deduplicate equations
  return [...new Set(equations)];
}

export async function startChatSession(equations: string[]): Promise<{ chatInstance: Chat, initialResponse: string }> {
  const systemInstruction = `You are an expert and friendly math tutor AI. The user has provided a set of mathematical equations and concepts. Your goal is to help them understand these topics and create a personalized study plan. Be encouraging and break down complex topics into simple steps. Use LaTeX format for all mathematical notations by enclosing them in $...$ for inline math and $$...$$ for block math. The user's materials cover the following: ${equations.join(', ')}.`;

  const chatInstance = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
  });

  const initialPrompt = "Based on the provided topics, please give me a brief overview and suggest a starting point for a study plan.";
  const result = await chatInstance.sendMessage({ message: initialPrompt });

  return { chatInstance, initialResponse: result.text };
}