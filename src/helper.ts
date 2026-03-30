import { env } from "cloudflare:workers";
import type { MessageContext, SenderInfo, UserInfo } from "workergram";
import type { ChatHistory, Transcript } from "./types.js";
import type { Content } from "@google/genai";

export function isAdmin(userId: string | number) {
  return userId == env.ADMIN_ID;
}

export async function isAuthorizedChat(chatId: string | number) {
  if (isAdmin(chatId)) return true;

  const result = await env.DB.prepare("SELECT 1  FROM auth WHERE chat_id = ?;")
    .bind(String(chatId))
    .first();

  return !!result;
}

export function parseName(sender: SenderInfo) {
  const { displayName, username } = sender;
  return username ? `@${username}` : displayName ? displayName : "unknown";
}

export function parseContents(history: ChatHistory[]): Content[] {
  return history.map(({ role, message }) => ({
    role,
    parts: [{ text: message }],
  }));
}

export function createTranscript(ctx: MessageContext): Transcript {
  const {
    chat,
    sender,
    message: { commandPayload },
  } = ctx;
  return {
    chat: chat.type === "private" ? "private" : "group",
    sender: parseName(sender),
    content: commandPayload || "empty message",
  };
}

export function clearHtml(text: string) {
  return text
    .replace(/^[ \t]+/gm, "")
    .replace(/<h1>(.*?)<\/h1>/gi, "⬜ <b>$1</b>\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "◻️ <b>$1</b>\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "◻️ <b>$1</b>\n")
    .replace(/<h4>(.*?)<\/h4>/gi, "▫️ <b>$1</b>\n")
    .replace(/<li>/gi, "  - ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol|div|p|section|article)>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
