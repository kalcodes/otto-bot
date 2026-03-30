import { env } from "cloudflare:workers";
import type { MessageContext } from "workergram";
import type { ContentListUnion, GenerateContentConfig } from "@google/genai";

import { initGoogleGenAI } from "./lib.js";
import { parseContents } from "./helper.js";
import { MODELS, getConfig } from "./config.js";
import type { ChatHistory, MODE, Transcript } from "./types.js";

// Lists authorized chats
export async function listAuthorizedChats(ctx: MessageContext) {
  const result: string[] = await env.DB.prepare(
    "SELECT chat_id FROM auth;",
  ).raw();

  await ctx.reply(
    `🛡️ Authorized Chats: \n\n${result.map((r, i) => `${i + 1}. \`${r}\``).join("\n")}`,
    {
      parse_mode: "Markdown",
    },
  );
}

// Handles authorization request
export async function handleAuthRequest(
  ctx: MessageContext,
  request: "authorize" | "unauthorize",
) {
  const { bot, message } = ctx;
  const text = message.text!;
  const authorize = request === "authorize";

  const chatId = message.commandPayload;
  if (!chatId) {
    await ctx.reply(
      "🫆 Unable to parse id! \nPlease check your id and try again.",
    );
    return;
  }

  if (authorize) {
    try {
      await bot.getChat(chatId);
    } catch (error) {
      await ctx.reply(
        "⚠️ Authorization failed! Please try again" +
          "\n- Check your id" +
          "\n- Add or start the bot in the target chat",
      );
      return;
    }

    try {
      await env.DB.prepare("INSERT INTO auth (chat_id) VALUES (?);")
        .bind(chatId)
        .run();
    } catch (error) {
      console.error("Unable to authorize chat: ", chatId, error);
      await ctx.reply(
        `⚠️ Unable to authorize chat: ${chatId}. \n\nUse /list command to see if authorized!`,
      );
      return;
    }
    await ctx.reply(
      `🔓 Authorization complete: \n\nAuthorized Chat: ${chatId}`,
    );
    return;
  }

  await env.DB.prepare("DELETE FROM auth WHERE chat_id = ?").bind(chatId).run();
  await ctx.reply(
    `🔒 Unauthorization complete: \n\nUnauthorized Chat: ${chatId}`,
  );
}

// Reads latest messages
export async function getChatHistory(
  chatId: string | number,
  limit: number = 10,
): Promise<ChatHistory[]> {
  const { results }: { results: ChatHistory[] } = await env.DB.prepare(
    "SELECT role, message FROM messages WHERE chat_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
  )
    .bind(chatId, limit)
    .run();

  return results.reverse();
}

// Wrapper for GoogleGenAI.models.generateContent
async function generateContent(
  contents: ContentListUnion,
  config: GenerateContentConfig,
): Promise<string> {
  const ai = initGoogleGenAI(env);

  // Generate content with fialover
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (!response.text) {
        throw new Error("Empty content generated");
      }
      return response.text;
    } catch (error) {
      console.error(`Generating content with ${model} failed.`);
      throw error;
    }
  }
  throw new Error("Unable to generate content!");
}

// Generates bot response
export async function generateAnswer(
  chatId: string | number,
  transcript: Transcript,
  mode: MODE = "wit",
): Promise<string> {
  let chatHistory: ChatHistory[] = [];
  const history = await env.KV.get("history");
  const historyEnabled = history === "on";
  if (historyEnabled) {
    chatHistory = chatHistory.concat(await getChatHistory(chatId));
  }
  const contents = [
    ...parseContents(chatHistory),
    { role: "user", parts: [{ text: JSON.stringify(transcript) }] },
  ];

  const answer = await generateContent(contents, getConfig(mode));
  const stmt = env.DB.prepare(
    "INSERT INTO messages (chat_id, role, message) VALUES (?, ?, ?);",
  );

  if (historyEnabled) {
    await env.DB.batch([
      stmt.bind(chatId, "user", JSON.stringify(transcript)),
      stmt.bind(chatId, "model", answer),
    ]);
  }

  return answer;
}

export async function clearDatabase(interval: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  try {
    await env.DB.prepare("DELETE FROM messages WHERE created_at < DATETIME(?);")
      .bind(cutoffDate.toISOString())
      .run();
  } catch (error) {
    console.error("Database clean up faild with: ", error);
  }
}
