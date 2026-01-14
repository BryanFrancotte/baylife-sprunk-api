import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import prisma from "./prisma";

const updateClientBody = t.Object({
  name: t.String(),
  phoneNumber: t.String()
})

export const client = new Elysia({prefix: "/client"})
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET!,
  }))
  .get("/", async () => {
    const result = await prisma.client.findMany();
    return result;
  })
  .put("/:id", async ({jwt, cookie: { session }, params: { id }, body}) => {
    const token = session.value;
    if(typeof token != 'string')
      return;

    const payload = await jwt.verify(token);
    if(!payload)
      return;

    const userId = payload.sub;
    const result = await prisma.client.update({
      where: {
        id: id
      },
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber,
        updatedBy: userId
      }
    })

    return result
  }, {
    body: updateClientBody
  })