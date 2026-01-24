import Elysia, { t } from "elysia";
import prisma from "./prisma";
import jwt from "@elysiajs/jwt";
import { client } from "./client";

const dispenserBody = t.Object({
  ownerName: t.Optional(t.String()),
  ownerPhoneNumber: t.Optional(t.String()),
  ownerId: t.Optional(t.String()),
  location: t.String(),
  locationImgUrl: t.Optional(t.String()),
  sharePercentage: t.Optional(t.Number()),
  comment: t.Optional(t.String())
})

const updateDispenserBody = t.Object({
  location: t.String(),
  locationImgUrl: t.Optional(t.String()),
  sharePercentage: t.Optional(t.Number()),
  comment: t.Optional(t.String())
})

const collectDispenserBody = t.Object({
  collectedAmount: t.Number()  
})

const updateOwnerBody = t.Object({
  name: t.String(),
  phoneNumber: t.String()
})

export const dispenser = new Elysia({ prefix: "/dispenser" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/", async () => {
    const result = await prisma.dispenser.findMany({
      include: {
        owner: true
      },
      orderBy: {
        createdAt: "asc"
      }
    })
    return result
  })
  .get("/owners/", async () => {
    const result = await prisma.client.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });
    return result;
  })
  .get("/phone/:phoneNumber", async ({ params: {phoneNumber} }) => {
    const result = await prisma.client.findFirst({
      where: {
        phoneNumber: phoneNumber
      },
      include: {
        dispensers: true
      },
      orderBy: {
        createdAt: "asc"
      }
    })
    return result
  })
  .post("/", async ({ jwt, cookie: { session }, body }) => {
    const token = session.value;
    if(typeof token != 'string')
      return;
    const payload = await jwt.verify(token)
    if(!payload || !payload.sub)
      return;
    console.log("test percentage: " + body.sharePercentage)
    const userId = payload.sub
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
          sharePercentage: body.sharePercentage,
          comments: body.comment,
          createdBy: {
            connect: {
              id: userId
            }
          },
        },
        include: {
          owner: true
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
          sharePercentage: body.sharePercentage,
          comments: body.comment,
          createdBy: {
            connect: {
              id: userId
            }
          },
        },
        include: {
          owner: true
        }
      })
      return result
    }
  }, {
    body: dispenserBody
  })
  .patch("/:id", async ({ jwt, cookie: { session }, params: { id }, body }) => {
    const token = session.value;
    if(typeof token != 'string')
      return;
    
    const payload = await jwt.verify(token);
    if(!payload)
      return;

    const userId = payload.sub;
    const result = await prisma.dispenser.update({
      where: {
        id: id
      },
      data: {
        location: body.location,
        locationImgUrl: body.locationImgUrl,
        sharePercentage: body.sharePercentage,
        comments: body.comment,
        updatedBy: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        owner: true
      }
    });

    return result;
  },{
    body: updateDispenserBody
  })
  .patch("/collect/:id", async ({ jwt, cookie: { session }, params: { id }, body }) => {
    const token = session.value;
    if(typeof token != 'string')
      return;

    const payload = await jwt.verify(token)
    if(!payload)
      return;

    const userId = payload.sub;

    const oldRecord = await prisma.dispenser.findFirst({
      where: {
        id: id
      }
    });

    if(!oldRecord)
      return;

    const result = await prisma.dispenser.update({
      where: {
        id: id
      },
      data: {
        updatedBy:{
          connect: {
            id: userId
          }
        },
        collectedAmount: body.collectedAmount,
        periodEnd: new Date(),
        periodStart: oldRecord.periodEnd,
        lastPeriondCollectedAmount: oldRecord.collectedAmount,
        totalMoneyGenerated: oldRecord.totalMoneyGenerated + body.collectedAmount
      },
      include: {
        owner: true
      }
    })

    return result
  },{
    body: collectDispenserBody
  })
  .patch("/owner/:id", async ({jwt, cookie: {session}, params: {id}, body}) => {
    const token = session.value;
    if (typeof token != "string") return;

    const payload = await jwt.verify(token);
    if (!payload) return;

    const userId = payload.sub

    const result = await prisma.client.update({
      where: {
        id: id
      },
      data: {
        updatedBy: userId,
        name: body.name,
        phoneNumber: body.phoneNumber 
      }
    })

    return result;
  }, {
    body: updateOwnerBody
  })