import { env } from "cloudflare:workers";
import type { MessageContext } from "workergram";
import { CommandConfig } from "./config.js";

async function createTables() {
  const createMessageTableStmt = `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT, role TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`;
  const createAuthTableStmt = `CREATE TABLE IF NOT EXISTS auth (chat_id TEXT UNIQUE);`;

  await env.DB.exec(createMessageTableStmt);
  await env.DB.exec(createAuthTableStmt);
}

async function callApi(path: string, body: Record<any, any>) {
  const baseUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

  const url = `${baseUrl}/${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    throw new Error("Telegram error");
  }
}

// Set up bot
export async function setUpBot(ctx: MessageContext) {
  const { bot } = ctx;

  const description = `Want a personal AI BOT hosted and owned by you. 
  
I'm Otto, btw
Find me here: https://github.com/0x4b414c/otto-bot.git
`;

  await createTables();
  await callApi("setMyName", {
    name: "Otto",
  });

  await callApi("setMyDescription", {
    description: description,
  });
  await callApi("setMyShortDescription", {
    short_description: description,
  });

  await bot.callApi("setMyCommands", {
    commands: CommandConfig,
    scope: {
      type: "all_group_chats",
    },
  });
}
