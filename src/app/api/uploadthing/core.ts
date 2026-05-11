import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Produktbilder — nur für Admins
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

  // Ankauf-Bilder — für alle (auch nicht eingeloggt), max 8 Bilder à 8 MB
  ankaufImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 8, contentDisposition: "inline" },
  })
    .middleware(async () => {
      // Kein Login erforderlich für Ankauf-Anfragen
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
