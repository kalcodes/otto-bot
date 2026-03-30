import type { GenerateContentConfig } from "@google/genai";
import type { MODE } from "./types.js";

export const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-preview",
  "gemini-2.5-flash",
];

export const baseInstruction =
  "Your name is Otto." +
  "Process json transcripts for context (chat, sender, content). " + 
  "Do not reference transcript metadata," + 
  "No conversational filler of follow-up questions at the end. ";

export const baseConfig: GenerateContentConfig = {
  temperature: 1,
  maxOutputTokens: 500,
  thinkingConfig: {
    includeThoughts: false,
  },
};

export const ModelInstruction: Record<MODE, string> = {
  wit:
    "You're not an assistant or a chat bot. " +
    "You're witty and casually brilliant. " +
    "You mock and offened people. " +
    "Use emojis like a human to convey tone, irony, or to be annoying. ",
  code: "Pure code solutions. " + "Use code blocks. " + "No emojies. ",
  ask:
    "Address inqueries objectively. " +
    "Format your output using only HTML tags (<h1>, <h2>, <h3>, <ul>, <li>, <b>, <i>, <code>)." +
    "No emojies. ",
  explain:
    "Deliver pure educational content. " +
    "Format your output using only HTML tags (<h1>, <h2>, <h3>, <ul>, <li>, <b>, <i>, <code>)." +
    "Use emojies to highlight key takeaways. " +
    "No intros.",
  summerize:
    "Format your output using only HTML tags (<h1>, <h2>, <h3>, <ul>, <li>, <b>, <i>, <code>)." +
    "Distill content on the given transcript into a brief objective summary. ",
};

export const ModelConfig: Record<MODE, GenerateContentConfig> = {
  wit: {
    temperature: 1,
    maxOutputTokens: 400,
  },
  ask: {
    temperature: 0.5,
    maxOutputTokens: 600,
  },
  code: {
    temperature: 0.1,
    maxOutputTokens: 1000,
  },
  explain: {
    temperature: 0.4,
    maxOutputTokens: 700,
  },
  summerize: {
    temperature: 0.3,
    maxOutputTokens: 400,
  },
};

export const CommandConfig = [
  {
    command: "otto",
    description: "Otto default mode",
  },
  {
    command: "wit",
    description: "Witty mode",
  },
  {
    command: "ask",
    description: "Assisting mode",
  },
  {
    command: "code",
    description: "Coding mode",
  },
  {
    command: "explain",
    description: "Explaining mode",
  },
  {
    command: "summerize",
    description: "Summerizing mode",
  },
  {
    command: "start",
    description: "Starts the bot",
  },
  {
    command: "usage",
    description: "Shows usage",
  },
  {
    command: "id",
    description: "Shows chat id",
  },
  {
    command: "auth_list",
    description: "List authorized chats",
  },
  {
    command: "mode",
    description: "Set default mode",
  },
  {
    command: "authorize",
    description: "Authorize chat",
  },
  {
    command: "unauthorize",
    description: "Unauthorize chat",
  },
  {
    command: "history",
    description: "Toogle history",
  },
  {
    command: "setup",
    description: "Setup bot commands",
  },
];

export function getConfig(mode: MODE): GenerateContentConfig {
  return {
    ...baseConfig,
    ...ModelConfig[mode],
    systemInstruction: baseInstruction.concat("\n\n", ModelInstruction[mode]),
  };
}
