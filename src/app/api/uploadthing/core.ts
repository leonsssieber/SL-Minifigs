import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 10, contentDisposition: "inline" },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user || !session.user.isAdmin) {
        throw new UploadThingError("Verboten");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
