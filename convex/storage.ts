import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const get_upload_url = mutation({
  async handler(ctx) {
    return await ctx.storage.generateUploadUrl();
  },
});

export const get_Object_url = mutation({
  args: {
    id: v.id("_storage"),
  },
  async handler(ctx, args) {
    return await ctx.storage.getUrl(args.id);
  },
});
