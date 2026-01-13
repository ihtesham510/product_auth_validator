"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import * as crypto from "crypto";

export const encrypt = action({
  args: {
    id: v.string(),
  },
  async handler(_, args) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) throw new ConvexError("SECRET_KEY is not set");

    // Derive a 32-byte key from the secret key using SHA-256
    const key = crypto.createHash("sha256").update(secretKey).digest();

    // Generate a random 16-byte IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher using AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    // Encrypt the data
    let encrypted = cipher.update(args.id, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data
    // Format: iv:authTag:encryptedData (all in hex)
    const result = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;

    return result;
  },
});

export const decrypt = action({
  args: {
    payload: v.string(),
  },
  async handler(_, { payload }) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) throw new ConvexError("SECRET_KEY is not set");

    try {
      // Split the encrypted string into IV, authTag, and encrypted data
      const parts = payload.split(":");
      if (parts.length !== 3) {
        throw new ConvexError("Invalid encrypted format");
      }

      const [ivHex, authTagHex, encrypted] = parts;

      // Convert hex strings back to buffers
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      // Derive the same 32-byte key from the secret key
      const key = crypto.createHash("sha256").update(secretKey).digest();

      // Create decipher using AES-256-GCM
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new ConvexError(
        `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});
