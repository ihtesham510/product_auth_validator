import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

export const verifyCode = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Find code by code string
    const codeDoc = await ctx.db
      .query("codes")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    // Check if code exists
    if (!codeDoc) {
      return {
        success: false,
        error: "Invalid code. This code does not exist.",
      };
    }

    // Check if code is valid
    if (!codeDoc.isValid) {
      return {
        success: false,
        error: "This code has already been used.",
      };
    }

    // Check if verified_codes entry already exists for this code
    const verifiedCode = await ctx.db
      .query("verified_codes")
      .withIndex("code", (q) => q.eq("code", codeDoc._id))
      .first();

    if (verifiedCode) {
      // Code already verified - check if name/phone match
      if (
        verifiedCode.name !== args.name ||
        verifiedCode.phone !== args.phone
      ) {
        return {
          success: false,
          error:
            "This code has already been verified with different details. Name and phone number cannot be changed.",
          existingDetails: {
            name: verifiedCode.name,
            phone: verifiedCode.phone,
          },
        };
      }

      // Name and phone match - allow re-verification
      return {
        success: true,
        message: "Code verified successfully. This code was previously verified.",
        verified: true,
        details: {
          name: verifiedCode.name,
          phone: verifiedCode.phone,
        },
      };
    }

    // Code not verified yet - create verified_codes entry and set isValid to false
    await ctx.db.insert("verified_codes", {
      name: args.name,
      phone: args.phone,
      code: codeDoc._id,
    });

    // Set code's isValid to false
    await ctx.db.patch(codeDoc._id, {
      isValid: false,
    });

    return {
      success: true,
      message: "Code verified successfully!",
      verified: false,
      details: {
        name: args.name,
        phone: args.phone,
      },
    };
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

    // Process codes in batches
    for (let i = 0; i < args.codes.length; i += batchSize) {
      const batch = args.codes.slice(i, i + batchSize);

      for (const code of batch) {
        // Skip empty codes
        if (!code || typeof code !== "string" || code.trim() === "") {
          skipped++;
          continue;
        }

        const trimmedCode = code.trim();

        // Check if code already exists
        const existingCode = await ctx.db
          .query("codes")
          .withIndex("code", (q) => q.eq("code", trimmedCode))
          .first();

        if (existingCode) {
          skipped++;
          continue;
        }

        try {
          // Insert new code with isValid: true
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

