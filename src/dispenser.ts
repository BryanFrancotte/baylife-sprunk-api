import Elysia, { t } from "elysia";
import prisma from "./prisma";
import jwt from "@elysiajs/jwt";

const dispenserBody = t.Object({
  ownerName: t.Optional(t.String()),
  ownerPhoneNumber: t.Optional(t.String()),
  ownerId: t.Optional(t.String()),
  location: t.String(),
  locationImgUrl: t.Optional(t.String()),
  sharedPercentage: t.Optional(t.Number())
})

const updateDispenserBody = t.Object({
  location: t.String(),
  locationImgUrl: t.Optional(t.String()),
  sharedPercentage: t.Optional(t.Number())
})

const collectDispenserBody = t.Object({
  collectedAmount: t.Number()  
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
  .post("/", async ({ jwt, cookie: { session }, body }) => {
    const token = session.value;
    if(typeof token != 'string')
      return;
    const payload = await jwt.verify(token)
    if(!payload || !payload.sub)
      return;
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
          sharePercentage: body.sharedPercentage,
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
          sharePercentage: body.sharedPercentage,
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
  .put("/:id", async ({ jwt, cookie: { session }, params: { id }, body }) => {
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
        sharePercentage: body.sharedPercentage,
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
  .put("/collect/:id", async ({ jwt, cookie: { session }, params: { id }, body }) => {
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