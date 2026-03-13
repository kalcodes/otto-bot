# Otto - Free Telegram AI Bot

This repositery contains easily deployable and free Telegram AI Bot source code. After deployment the bot can be accessed through telegram private chats and groups. This project uses Google's Gemini AI and Cloudflare Worker services.

### Deployment:

**Requirements**: to make this work you will need a telegram, google and cloudflare accounts.

- Go to telegram [bot father](https://t.me/botfather) and create a new bot to get a token.
- Go to [google ai studio](https://aistudio.google.com), sign up with your google account and get gemini api key.
- Go ahead and create [cloudflare](https://dash.cloudflare.com) account.
- Generate a random secret to verify telegram webhook notfications. You can run the shell command below to generate a random token.

```sh
$ openssl rand --base64 32
```

Click the `Deploy to Cloudflare` button below to see the deployment dashboard on cloudflare and follow the steps over there.

Make sure your varaibles are provided correctly, also the build and deploy command are set as `pnpm run build` and `pnpm run deploy` respectively. All of the following fields are required. `ADMIN_ID`, `BOT_TOKEN`, `GEMINI_API_KEY` and `TELEGRAM_SECRET`.

After the deployment process has finished, grab your deploymet url, and run the command show below by replacing all values in curly braces.

```sh
$ export URL={your-deployment-url}
$ export SECRET={your-telegram-secret}
$ export BOT_TOKEN={your-bot-token}
```

```sh
$ curl -X POST 'https://api.telegram.org/bot$BOT_TOKEN' -H 'content-type: application/json' -d "{\"url\": \"$URL\", \"secret\": \"$SECRET\", allowedUpdates: [\"message\"]}"
```

Finally, open your bot, `/start` it and send `/setup` command this will initialize all the nessasary configurations. Please don't send other commands without running the `/setup` command things will fail.

**Notes:**

- Chats must be authorized before they can interact with the bot.
- The user with `ADMIN_ID` is always authorized, also only the this user can authorize new chats.
- If group chats are authorized all members can interact with the bot.
---
With all of that done, you can start using your personal AI bot.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/0x4b414c/otto-bot)

Pull Requests are welcomed. If you have any problems ask on the `Descussion` section or create issue in this repository. 
