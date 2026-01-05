import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth } from "./auth";
import { jwt } from "@elysiajs/jwt";
import { authDiscord } from "./auth-discrod";

const app = new Elysia()
  .use(openapi())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(authDiscord)
  .get("/", () => "Hello Elysia")
  .listen(3500);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
