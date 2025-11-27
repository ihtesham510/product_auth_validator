import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionId: v.string(),
    username: v.string(),
  }).index("sessionId", ["sessionId"]),
  
  adminCredentials: defineTable({
    username: v.string(),
    password: v.string(),
  }),
  
  codes: defineTable({
    code: v.string(),
    isValid: v.boolean(),
  }).index("code", ["code"]),
  
  verified_codes: defineTable({
    name: v.string(),
    phone: v.string(),
    code: v.id("codes"),
  }).index("code", ["code"]),
});

