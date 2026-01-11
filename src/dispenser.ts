import Elysia, { t } from "elysia";
import prisma from "./prisma";
import jwt from "@elysiajs/jwt";

const dispenserBody = t.Object({
  ownerName: t.Optional(t.String()),
  ownerPhoneNumber: t.Optional(t.String()),
  ownerId: t.Optional(t.String()),
  location: t.String(),
  locationImgUrl: t.Optional(t.String()),
  sharedPercentage: t.Optional(t.String())
})

export const dispenser = new Elysia({ prefix: "/dispenser" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/", async () => {
    const response = await prisma.dispenser.findMany({
      include: {
        owner: true
      }
    })
    return response
  })
  .get("/phone/:phoneNumber", async ({ params: {phoneNumber} }) => {
    const result = await prisma.client.findFirst({
      where: {
        phoneNumber: phoneNumber
      },
      include: {
        dispensers: true
      }
    })
    return result
  })
  .post("/", async ({ jwt, cookie, body }) => {
    const token = cookie.session.value;
    if(typeof token != 'string')
      return;
    const payload = await jwt.verify(token)
    if(!payload || !payload.sub)
      return;
    const userId = payload.sub
    console.log(userId)
    if(!body.ownerId) {
      const result = await prisma.dispenser.create({
        data: {
          owner: {
            create: {
              name: body.ownerName!,
              phoneNumber: body.ownerPhoneNumber!,
              createdBy: userId,
            }
          },
          location: body.location,
          createdBy: {
            connect: {
              id: userId
            }
          },
        }
      })
      return result
    } else {
      const result = await prisma.dispenser.create({
        data: {
          owner: {
            connect: {
              id: body.ownerId
            }
          },
          location: body.location,
          createdBy: {
            connect: {
              id: userId
            }
          },
        }
      })
      return result
    }
  }, {
    body: dispenserBody
  })
  .patch("/:id", async ({ params: { id } }) => {

  })
  .patch("/collect/:id", async ({ params: { id } }) => {

  })