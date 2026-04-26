import { Elysia, t } from "elysia";
import { env } from "../config/env";
import { HttpError } from "../lib/http";

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
    async ({ body, set }) => {
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
