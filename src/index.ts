import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { authDiscord } from "./auth-discrod";
import cors from "@elysiajs/cors";
import { dispenser } from "./dispenser";

const app =  new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
  }))
  .use(openapi())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(authDiscord)
  .use(dispenser)
  .get("/", () => "Hello Elysia");

const port = 3500;

app.listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export default app;
