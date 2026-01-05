import prisma from "../prisma"
import { decryptTokenBlob, encryptTokenBlob } from "./crypto";

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: "authorizatioin_code",
    code,
    redirect_uri: redirectUri
  })

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })

  if (!response.ok) throw new Error("Failed to exchange discord token");

  return await response.json();
}

export async function getDiscordUser(accessToken: string) {
  const response = await fetch("http://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if(!response.ok) throw new Error("Failed to fetch Discord user")

  return response.json()
}

export async function getDiscordGuildMember(accessToken: string, guildId: string, userId: string){
  const response = await fetch(`http://discord.com/api/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if(!response.ok) throw new Error ("Failed to fetch discord guild member")

  return response.json()
}

export async function refreshToken(userId: string) {
  const user = await prisma.user.findUnique( {where: { id: userId } })
  if (!user || !user.tokenCipher) throw new Error("No stored tokens")

  const tokenBlob = decryptTokenBlob(user.tokenCipher)

  if (tokenBlob.expires_at && Date.now() < tokenBlob.expires_at - 60_000) {
    return tokenBlob.access_token
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: tokenBlob.refresh_token
  })

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })

  if (!response.ok) {
    await prisma.user.update({
      while: { id: userId },
      data: { tokenCipher: null, refreshExpires: null}
    })
    throw new Error("Failed to refresh Discord token")
  }

  const newToken = await response.json()

  const newTokenBlob = {
    access_token: newToken.access_token,
    refresh_token: newToken.refresh_token ?? tokenBlob.refresh_token,
    expires_at: Date.now() + newToken.expires_in * 1000
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      tokenCipher: encryptTokenBlob(newTokenBlob),
      refreshExpires: new Date(newTokenBlob.expires_at)
    }
  })

  return newTokenBlob.access_token
}