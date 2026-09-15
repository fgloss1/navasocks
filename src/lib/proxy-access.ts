import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.PROXY_ACCESS_SECRET;

  if (!secret) {
    throw new Error("PROXY_ACCESS_SECRET is required.");
  }

  return createHash("sha256")
    .update(secret)
    .digest();
}

export function createProxyUsername(): string {
  return `nava-${randomBytes(6).toString("hex")}`;
}

export function createProxyPassword(): string {
  return randomBytes(18).toString("base64url");
}

export function encryptProxyPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    ALGORITHM,
    getKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptProxyPassword(payload: string): string {
  const parts = payload.split(".");

  if(parts.length !== 3){
    throw new Error(
      "Invalid encrypted proxy password.",
    );
  }

  const [ivText, tagText, encryptedText] = parts;

  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivText, "base64url"),
  );

  decipher.setAuthTag(
    Buffer.from(tagText, "base64url"),
  );

  return Buffer.concat([
    decipher.update(
      Buffer.from(encryptedText, "base64url"),
    ),
    decipher.final(),
  ]).toString("utf8");
}