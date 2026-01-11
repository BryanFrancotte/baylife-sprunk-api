import Elysia from "elysia";
import prisma from "./prisma";
import jwt from "@elysiajs/jwt";

export const user = new Elysia({ prefix: "/user" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/", async () => {
    const result = await prisma.user.findMany();
    return result
  })
  .get("/@me", async ({jwt, cookie}) => {
    const token = cookie.session?.value
    if(!token || typeof token !== 'string')
      return
    const payload = await jwt.verify(token)
    if(!payload)
      return
    const userId = payload.sub
    const result = await prisma.user.findFirst({
      where: {
        id: userId
      }
    })
    return result
  })