import bot from "./bot.js";
import type { Update } from "workergram";
import { clearDatabase } from "./services.js";

export default {
  // Handle Telegram Update
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secretToken !== env.TELEGRAM_SECRET) {
      return new Response("Unauthorized", { status: 200 });
    }

    try {
      const upadte = (await request.json()) as Update;
      await bot.processUpdate(upadte);

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response("Error Processing Update", { status: 500 });
    }
  },

  // Scheduled Database CleanUp
  async scheduled() {
    await clearDatabase();
  },
} satisfies ExportedHandler<Env>;
