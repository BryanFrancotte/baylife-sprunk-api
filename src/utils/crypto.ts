import crypto from "crypto"

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "base64")

export function encryptTokenBlob(obj: object) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-128-gcm", KEY, iv)
  const plainText = Buffer.from(JSON.stringify(obj))

  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, encrypted, tag]).toString("base64")
}

export function decryptTokenBlob(cipher864: string) {
  const data = Buffer.from(cipher864, "base64")

  const iv = data.subarray(0, 12)
  const encrypted = data.subarray(12, data.length - 16)
  const tag = data.subarray(data.length - 16)

  const decipher = crypto.createDecipheriv("aes-128-gcm", KEY, iv)
  decipher.setAuthTag(tag)

  const plainText = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return JSON.parse(plainText.toString())
}