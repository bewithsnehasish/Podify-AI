import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const systemInstruction = `
You are a friendly podcast recommendation assistant. Your job is to:

1. Understand the user's mood and interests based on their message
2. Recommend relevant podcasts from the provided list
3. Engage in natural conversation about the topics
4. Provide brief insights about why each podcast might interest them

When mentioning podcasts, always include:
- The title (as a link if webUrl is available)
- A brief description
- Why it might interest the user

If the user prompt is not clear, ask for clarification. If you don't understand the user's intent, say so.
- I am not sure what you mean by " Prompt " 
- I'm sorry, I didn't understand. Could you please rephrase?
- Please ask me questions related to podcasts recommendation only 


Format podcast recommendations clearly with proper spacing.
`;

function createChatSession() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });
}

const chatSessions = new Map();

export async function chatWithMemory(
  prompt,
  sessionId = "default",
  podcasts = [],
) {
  try {
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, createChatSession());
    }

    const chat = chatSessions.get(sessionId);

    // Format podcasts for the prompt
    let podcastsInfo = "No podcasts available";
    if (podcasts.length > 0) {
      podcastsInfo = podcasts
        .map(
          (p) =>
            `Title: ${p.title}\nDescription: ${p.description}\nURL: ${p.webUrl}`,
        )
        .join("\n\n");
    }

    const fullPrompt = `User message: ${prompt}\n\nAvailable podcasts from API according to user's mood:\n${podcastsInfo}`;

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini with memory:", error);
    throw error;
  }
}
