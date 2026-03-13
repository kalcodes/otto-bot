import { filters } from "workergram";
import { env } from "cloudflare:workers";
import { initBot } from "./lib.js";
import { clearHtml, createTranscript } from "./helper.js";
import { withMiddelware } from "./middleware.js";
import {
  generateAnswer,
  listAuthorizedChats,
  handleAuthRequest,
} from "./services.js";
import { ModelConfig } from "./config.js";
import type { MODE } from "./types.js";
import { setUpBot } from "./setup.js";

const bot = initBot(env);

// Welcome user
bot.onCommand("start", async (ctx) => {
  await withMiddelware(ctx, async () => {
    await ctx.reply(
      `
🤖 Hi! I'm otto, your personal AI. 
Use the /usage to see all available commands.

Tip: this project is available for free on <a href="https://github.com/0x4b414c/otto-bot">github</a>. 
`,
      {
        parse_mode: "HTML",
      },
    );
  });
});

// Authorize chat
bot.onCommand("authorize", async (ctx) => {
  await withMiddelware(
    ctx,
    async () => {
      await handleAuthRequest(ctx, "authorize");
    },
    {
      auth: "admin",
    },
  );
});

// Unauthorize chat
bot.onCommand("unauthorize", async (ctx) => {
  await withMiddelware(
    ctx,
    async () => {
      await handleAuthRequest(ctx, "unauthorize");
    },
    {
      auth: "admin",
    },
  );
});

// Listing authorized chats
bot.onCommand("auth_list", async (ctx) => {
  await withMiddelware(
    ctx,
    async () => {
      await listAuthorizedChats(ctx);
    },
    {
      auth: "admin",
    },
  );
});

// Gets chat ID
bot.onCommand("id", async (ctx) => {
  await ctx.reply(`Chat ID: ${ctx.chatId}`);
});

// Sets up bot
bot.onCommand("setup", async (ctx) => {
  await withMiddelware(
    ctx,
    async () => {
      await setUpBot(ctx);
      await ctx.reply("✅ Done setting up  bot.");
    },
    { auth: "admin" },
  );
});

// Toogle chat history
bot.onCommand("history", async (ctx) => {
  await withMiddelware(
    ctx,
    async () => {
      const h = await env.KV.get("history");
      await env.KV.put("history", !h || h === "off" ? "on" : "off");
      await ctx.reply(
        `Chat history ${!h || h === "off" ? "enabled" : "disabled"} successfully.`,
      );
    },
    {
      auth: "admin",
    },
  );
});

// Set default mode
bot.onCommand("mode", async (ctx) => {
  const { commandPayload } = ctx.message;

  await withMiddelware(
    ctx,
    async () => {
      if (!commandPayload || !(commandPayload in ModelConfig)) {
        await ctx.reply("⚠️ Invalid argument!");
        return;
      }

      await env.KV.put("mode", commandPayload);
      await ctx.reply("✅ Default mode upated successfully.");
    },
    { auth: "admin" },
  );
});

// Shows usage info
bot.onCommand("usage", async (ctx) => {
  await ctx.reply(
    `
Available commands: 
/start - start the bot
/usage - show command usage
/id - show chat id
/authorize <chat_id> - authorize chat
/unauthorize <chat_id> - unauthorize chat
/auth_list - list authorized chat list
/mode <mode> - set default mode
/history - toogle history on and off
/setup - setup bot name, description and commands
/otto <prompt> - call otto with default mode
/wit <prompt> - call otto with wit mode
/ask <prompt> - call otto with assist mode
/code <prompt> - call otto with code mode
/explain <prompt> - call otto with explaining mode
/summerize <prompt> - call otto with summerize mode
`,
  );
});

// Generate answer
bot.onUpdate(
  "message",
  async (ctx) => {
    const { chatId, messageId } = ctx;
    const { command } = ctx.message;

    if (!command) return;
    await withMiddelware(ctx, async () => {
      let mode: string | null = command;
      if (command.toLowerCase() === "otto") {
        mode = (await env.KV.get("mode")) || "wit";
      }
      if (!mode || !(mode in ModelConfig)) return;

      const transcript = createTranscript(ctx);
      const answer = await generateAnswer(chatId, transcript, mode as MODE);
      const cleared = ["ask", "explain", "summerize"].includes(mode)
        ? clearHtml(answer)
        : answer;
      await ctx.reply(cleared, {
        parse_mode: "HTML",
        reply_to_message_id: messageId,
      });
    });
  },
  filters.textMatches(/^\//),
);

// Tracks chat history
bot.onUpdate(
  "message",
  async (ctx) => {
    await withMiddelware(ctx, async () => {
      const { chatId } = ctx;

      const history = await env.KV.get("history");
      if (history !== "on") return;

      await env.DB.prepare(
        "INSERT INTO messages (chat_id, role, message) VALUES (?, 'user', ?);",
      )
        .bind(chatId, JSON.stringify(createTranscript(ctx)))
        .run();
    });
  },
  filters.not(filters.textMatches(/^\//)),
);

export default bot;
