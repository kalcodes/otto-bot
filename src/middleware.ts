import type { ChatAction, MessageContext } from "workergram";
import { isAdmin, isAuthorizedChat } from "./helper.js";

type MiddlewareOptions = {
  auth: "chat" | "admin";
  action?: ChatAction;
};

type Middleware = (
  ctx: MessageContext,
  handler: () => Promise<void>,
  options?: Partial<MiddlewareOptions>,
) => Promise<void>;

export const withMiddelware: Middleware = async (ctx, handler, options) => {
  const { chatId } = ctx;
  const op: MiddlewareOptions = {
    auth: "chat",
    ...options,
  };
  try {
    op.action && (await ctx.bot.sendChatAction(chatId, op.action));
    const authorized =
      op.auth && op.auth == "admin"
        ? isAdmin(chatId)
        : await isAuthorizedChat(chatId);

    authorized ? await handler() : await ctx.reply("🔐 Unauthorized!");
  } catch (err) {
    console.error(err);
    await ctx.reply(
      "⚠️ Something went wrong!" +
        "\nIf your are an admin please check the logs on cloudflare dashboard.",
    );
  }
};
