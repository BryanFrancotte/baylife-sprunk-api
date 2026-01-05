import Elysia from "elysia";
import jwt from "@elysiajs/jwt";

export const auth = new Elysia({ prefix:"/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!
    })
  )
  .get("/discord", ({ redirect }) => {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      response_type: "code",
      scope: "identify guilds.members.read email"
    });

    return redirect(`https://discord.com/api/oauth2/authorize?${params}`)
  })
  .get("/discord/callback", async ({ query, jwt ,cookie, redirect}) => {
    const code = query.code
    if (!code) return "Missing code"

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!
      })
    }).then(r => r.json())

    const user = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    }).then(r => r.json())

    const guilds = await fetch(`https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`, {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}`}
    }).then(r => r.json())

    console.log(user)
    console.log(guilds)


    const session = await jwt.sign({
      id: user.id,
      username: user.username
    });

    cookie.session.set({
      value: session,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60*60*24*7
    })

    return redirect("http://localhost:3000/dispenser")
  })
  .get("/discord/me", async ({ jwt, cookie }) => {
    const token = cookie.session.value;
    if (!token) return { loggedIn: false }

    const data = await jwt.verify(token as string)
    return { loggedIn: true, user: data}
  })