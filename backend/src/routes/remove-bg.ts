import { Elysia, t } from "elysia";
import { env } from "../config/env";
import { HttpError } from "../lib/http";
import { auth } from "../auth";

const REMOVE_BG_LIMIT = 5; // 5 requests per minute per user
const REMOVE_BG_WINDOW = 60 * 1000;
const usageMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const usage = usageMap.get(userId);

  if (!usage || now > usage.reset) {
    usageMap.set(userId, { count: 1, reset: now + REMOVE_BG_WINDOW });
    return true;
  }

  if (usage.count >= REMOVE_BG_LIMIT) {
    return false;
  }

  usage.count++;
  return true;
}

function removeBgKey(): string {
  const k = env.REMOVE_BG_API_KEY;
  if (!k) {
    throw new HttpError(
      503,
      "Remove.bg is not configured (set REMOVE_BG_API_KEY on the server).",
    );
  }
  return k;
}

export const removeBgRoutes = new Elysia({ prefix: "/remove-bg" })
  .post(
    "/",
    async ({ body, set, request }) => {
      const authSession = await auth.api.getSession({
        headers: request.headers,
      });

      if (!authSession) {
        throw new HttpError(401, "Authentication required");
      }

      if (!checkRateLimit(authSession.user.id)) {
        throw new HttpError(429, "Too many requests. Please try again later.");
      }

      const key = removeBgKey();
      
      const formData = new FormData();
      formData.append("image_file", body.image_file);
      formData.append("size", body.size || "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": key,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpError(
          response.status === 401 || response.status === 403 ? 502 : response.status,
          `Remove.bg API failed: ${errorText}`,
        );
      }

      const resultBlob = await response.blob();
      
      // Return the blob directly with correct content type
      set.headers["content-type"] = response.headers.get("content-type") || "image/png";
      return resultBlob;
    },
    {
      body: t.Object({
        image_file: t.File(),
        size: t.Optional(t.String()),
      }),
    },
  );
