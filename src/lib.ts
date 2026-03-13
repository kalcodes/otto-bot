import { GoogleGenAI } from "@google/genai";
import { Bot } from "workergram";

// Initialize GoogleGenAI
export function initGoogleGenAI(env: Env): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });
}

// Initialize Bot
export function initBot(env: Env) {
  return new Bot(env.BOT_TOKEN);
}
