you aimport { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

export const verifyCode = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    phone: v.string(),
    cnic_image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let id = null;
    let success = false;
    let isValid = false;
    let hasPrize = false;
    let prize_info = null;
    let message = "Invalid Code";
    let prizeClaimed = false;
    const codeDoc = await ctx.db
      .query("codes")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();
    if (codeDoc) {
      success = true;
      message = "The Code is Valid";
      isValid = codeDoc.isValid;
      if (!isValid) {
        message = "The Code is Already used.";
      }
      const prize = await ctx.db
        .query("prizes")
        .withIndex("code_id", (q) => q.eq("code_id", codeDoc._id))
        .first();
      if (prize) {
        hasPrize = true;
        const prize_def = await ctx.db
          .query("prize_definitions")
          .withIndex("by_id", (q) => q.eq("_id", prize.prize_definition_id))
          .first();
        const claimable_prize = await ctx.db
          .query("claimable_prizes")
          .withIndex("code_id", (q) => q.eq("code_id", codeDoc._id))
          .first();
        prizeClaimed = !!claimable_prize;
        prize_info = prize_def ? prize_def : undefined;
      }
      const verifiedDoc = await ctx.db.insert("verified_codes", {
        name: args.name,
        phone: args.phone,
        code: codeDoc._id,
      });
      id = verifiedDoc ?? null;

      await ctx.db.patch(codeDoc._id, {
        isValid: false,
      });
    }
    return {
      id,
      success,
      isValid,
      hasPrize,
      prize_info,
      prizeClaimed,
      message,
    };
  },
});

export const verifyPrize = query({
  args: {
    id: v.optional(v.id("verified_codes")),
  },
  async handler(ctx, { id }) {
    if (!id) return false;
    const verifiedDoc = await ctx.db.get(id);
    if (!verifiedDoc) {
      return false;
    }
    const claimable_prize = await ctx.db
      .query("claimable_prizes")
      .withIndex("verified_code_id", (q) =>
        q.eq("verified_code_id", verifiedDoc?._id),
      )
      .first();
    if (!claimable_prize) {
      return true;
    }
  },
});

export const getCodeStatus = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx: QueryCtx, args) => {
    const codeDoc = await ctx.db
      .query("codes")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!codeDoc) {
      return {
        exists: false,
        isValid: false,
        verified: false,
        codeId: null,
      };
    }

    const verifiedCode = await ctx.db
      .query("verified_codes")
      .withIndex("code", (q) => q.eq("code", codeDoc._id))
      .first();

    return {
      exists: true,
      isValid: codeDoc.isValid,
      verified: !!verifiedCode,
      codeId: codeDoc._id,
      verifiedDetails: verifiedCode
        ? {
            name: verifiedCode.name,
            phone: verifiedCode.phone,
          }
        : null,
    };
  },
});

export const getVerifiedCodeByCodeId = query({
  args: {
    codeId: v.id("codes"),
  },
  handler: async (ctx: QueryCtx, args) => {
    const verifiedCode = await ctx.db
      .query("verified_codes")
      .withIndex("code", (q) => q.eq("code", args.codeId))
      .first();

    if (!verifiedCode) {
      return null;
    }

    return {
      name: verifiedCode.name,
      phone: verifiedCode.phone,
      codeId: verifiedCode.code,
    };
  },
});

export const importCodes = mutation({
  args: {
    codes: v.array(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const batchSize = 100; // Process codes in batches to avoid timeouts
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < args.codes.length; i += batchSize) {
      const batch = args.codes.slice(i, i + batchSize);

      for (const code of batch) {
        if (!code || typeof code !== "string" || code.trim() === "") {
          skipped++;
          continue;
        }

        const trimmedCode = code.trim();

        const existingCode = await ctx.db
          .query("codes")
          .withIndex("code", (q) => q.eq("code", trimmedCode))
          .first();

        if (existingCode) {
          skipped++;
          continue;
        }

        try {
          await ctx.db.insert("codes", {
            code: trimmedCode,
            isValid: true,
          });
          imported++;
        } catch (error) {
          errors.push(`Failed to import code: ${trimmedCode}`);
        }
      }
    }

    return {
      success: true,
      imported,
      skipped,
      total: args.codes.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

export const getAllCodes = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const codes = args.limit
      ? await ctx.db.query("codes").take(args.limit)
      : await ctx.db.query("codes").collect();
    const codesWithDetails = await Promise.all(
      codes.map(async (code) => {
        const verifiedCode = await ctx.db
          .query("verified_codes")
          .withIndex("code", (q) => q.eq("code", code._id))
          .first();

        const prize = await ctx.db
          .query("prizes")
          .withIndex("code_id", (q) => q.eq("code_id", code._id))
          .first();

        let prizeName = null;
        if (prize) {
          const prizeDefinition = await ctx.db.get(prize.prize_definition_id);
          if (prizeDefinition) {
            prizeName = prizeDefinition.prize_name;
          }
        }

        return {
          id: code._id,
          code: code.code,
          isValid: code.isValid,
          verified: !!verifiedCode,
          verifiedDetails: verifiedCode
            ? {
                name: verifiedCode.name,
                phone: verifiedCode.phone,
              }
            : null,
          prizeName,
        };
      }),
    );
    return codesWithDetails;
  },
});

export const getAllVerifiedCodes = query({
  handler: async (ctx: QueryCtx) => {
    const verifiedCodes = await ctx.db.query("verified_codes").collect();
    const verifiedCodesWithDetails = await Promise.all(
      verifiedCodes.map(async (verifiedCode) => {
        const code = await ctx.db.get(verifiedCode.code);
        const prize = code
          ? await ctx.db
              .query("prizes")
              .withIndex("code_id", (q) => q.eq("code_id", code._id))
              .first()
          : null;

        let prizeName = null;
        if (prize) {
          const prizeDefinition = await ctx.db.get(prize.prize_definition_id);
          if (prizeDefinition) {
            prizeName = prizeDefinition.prize_name;
          }
        }

        return {
          id: verifiedCode._id,
          name: verifiedCode.name,
          phone: verifiedCode.phone,
          code: code?.code || null,
          codeId: verifiedCode.code,
          isValid: code?.isValid || false,
          prizeName,
        };
      }),
    );
    return verifiedCodesWithDetails;
  },
});

export const getCode = query({
  args: { id: v.id("codes") },
  async handler(ctx, { id }) {
    return await ctx.db.get(id);
  },
});

export const updateCode = mutation({
  args: {
    code_id: v.id("codes"),
    code: v.string(),
    isValid: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const trimmedCode = args.code.trim();

    const existingCode = await ctx.db
      .query("codes")
      .withIndex("code", (q) => q.eq("code", trimmedCode))
      .first();

    if (existingCode && existingCode._id !== args.code_id) {
      throw new ConvexError("A code with this value already exists");
    }

    const updateData: { code: string; isValid?: boolean } = {
      code: trimmedCode,
    };

    if (args.isValid !== undefined) {
      updateData.isValid = args.isValid;
    }

    await ctx.db.patch(args.code_id, updateData);

    return { success: true };
  },
});

export const deleteCodes = mutation({
  args: {
    ids: v.array(v.id("codes")),
  },
  async handler(ctx, args) {
    await Promise.all(
      args.ids.map(async (id) => {
        await ctx.db.delete(id);
        const claimed_prizes = await ctx.db
          .query("claimable_prizes")
          .withIndex("code_id", (q) => q.eq("code_id", id))
          .first();
        const verified_code = await ctx.db
          .query("verified_codes")
          .withIndex("code", (q) => q.eq("code", id))
          .first();
        const prizes = await ctx.db
          .query("prizes")
          .withIndex("code_id", (q) => q.eq("code_id", id))
          .first();
        if (claimed_prizes) {
          await ctx.db.delete(claimed_prizes?._id);
        }
        if (prizes) {
          await ctx.db.delete(prizes?._id);
        }

        if (verified_code) {
          await ctx.db.delete(verified_code?._id);
        }
      }),
    );
  },
});
