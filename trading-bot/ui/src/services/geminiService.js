import axios from 'axios';
import { CONFIG } from '../config.js';

export async function callGemini(systemPrompt, userMessage, isRetry = false) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent`;
    
    const response = await axios.post(
      url,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'x-goog-api-key': CONFIG.geminiApiKey,
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    if (!isRetry) {
      console.warn("Gemini API call failed. Retrying in 2 seconds...", error?.message);
      await new Promise(r => setTimeout(r, 2000));
      return callGemini(systemPrompt, userMessage, true);
    }
    console.error("Error calling Gemini API:", error?.response?.data || error.message);
    throw error;
  }
}
