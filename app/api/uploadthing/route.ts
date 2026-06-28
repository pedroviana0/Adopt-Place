import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "@/lib/upload-router";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
