import Elysia, { t } from "elysia";
import {
  exchangeCodeForToken,
  getDiscordGuildMember,
  getDiscordUser,
} from "./utils/discord";
import prisma from "./prisma";
import { encryptTokenBlob } from "./utils/crypto";
import jwt from "@elysiajs/jwt";

export const authDiscord = new Elysia({ prefix: "/auth/discord" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/", ({ redirect }) => {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      response_type: "code",
      scope: "identify guilds.members.read",
    });

    return redirect(`https://discord.com/api/oauth2/authorize?${params}`);
  })
  .get(
    "/callback",
    async ({ query, jwt, cookie, set }) => {
      const { code } = query;

      if (!code) {
        set.status = 400;
        return "Missing code";
      }

      const redirectUri = process.env.DISCORD_REDIRECT_URI!;

      const tokenResponse = await exchangeCodeForToken(code, redirectUri);

      const tokenBlob = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: Date.now() + tokenResponse.expires_in * 1000,
      };

      const discordUser = await getDiscordUser(tokenBlob.access_token);
      const guildMember = await getDiscordGuildMember(
        tokenBlob.access_token,
        process.env.DISCORD_GUILD_ID!,
        discordUser.id
      );

      if (!guildMember) {
        set.status = 403;
        return "You are not a member of the server";
      }

      if (!guildMember.roles.includes(process.env.DISCORD_ROLE_ID!)) {
        set.status = 403;
        return "You don't have the required permision to access this page";
      }

      const cipher = encryptTokenBlob(tokenBlob);

      const user = await prisma.user.upsert({
        where: { discordId: discordUser.id },
        update: {
          name: discordUser.username,
          tokenCipher: cipher,
          refreshExpiresAt: new Date(tokenBlob.expires_at),
        },
        create: {
          discordId: discordUser.id,
          name: discordUser.username,
          avatar: discordUser.avatar_url ?? null,
          tokenCipher: cipher,
          refreshExpiresAt: new Date(tokenBlob.expires_at),
        },
      });

      const session = jwt.sign({ sub: user.id });

      cookie.session.set({
        value: session,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      set.status = 302;
      set.headers = {
        Location: process.env.FRONTEND_URL!,
      };
      return;
    },
    {
      query: t.Object({
        code: t.String(),
      }),
    }
  );
