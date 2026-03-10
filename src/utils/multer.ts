import multer from "multer";
import { loadEnvFile } from "process";
import type { Request } from "express";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import sharp from "sharp";

export const multerConfig = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "invalid file type, only PDF, JPEG and PNG files are allowed",
        ),
        false,
      );
    }
  },
};

interface CloudinaryFile extends Express.Multer.File {
  buffer: Buffer;
}

loadEnvFile();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_SECRET as string,
});

const upload = multer(multerConfig);
export const fileUploadMiddleware = upload.single("file");

export const uploadFile = async (req: Request) => {
  const file: CloudinaryFile = req.file as unknown as CloudinaryFile;
  if (!file) {
    throw new Error("no file provided");
  }

  return new Promise<{ filename: string; meme_type: string; url: string }>(
    async (resolve, reject) => {
      try {
        let processBuffer: Buffer = file.buffer;
        if (file.mimetype.startsWith("image/")) {
          processBuffer = await sharp(file.buffer)
            .resize({ width: 800, height: 600 })
            .toBuffer();
        }
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "supported_files",
          },
          (
            err: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (err) {
              const error = "cloudinary upload error: " + err;
              console.error(error);
              return reject(new Error(error));
            }
            if (!result) {
              const error = "cloudinary upload error: result is undefined";
              console.error(error);
              return reject(new Error(error));
            }

            resolve({
              filename: file.originalname,
              meme_type: file.mimetype,
              url: result.secure_url,
            });
          },
        );
        uploadStream.end(processBuffer);
      } catch (err) {
        reject(err);
      }
    },
  );
};
export const overrideFile = async (req: Request, public_id: string) => {
  const file: CloudinaryFile = req.file as unknown as CloudinaryFile;
  if (!file) {
    throw new Error("no file provided");
  }

  return new Promise<{ filename: string; meme_type: string; url: string }>(
    async (resolve, reject) => {
      try {
        let processBuffer: Buffer = file.buffer;
        if (file.mimetype.startsWith("image/")) {
          processBuffer = await sharp(file.buffer)
            .resize({ width: 800, height: 600 })
            .toBuffer();
        }
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "supported_files",
            public_id,
            overwrite: true,
            invalidate: true,
          },
          (
            err: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (err) {
              const error = "cloudinary upload error: " + err;
              console.error(error);
              return reject(new Error(error));
            }
            if (!result) {
              const error = "cloudinary upload error: result is undefined";
              console.error(error);
              return reject(new Error(error));
            }

            resolve({
              filename: file.originalname,
              meme_type: file.mimetype,
              url: result.secure_url,
            });
          },
        );
        uploadStream.end(processBuffer);
      } catch (err) {
        reject(err);
      }
    },
  );
};
export const deleteFile = async (public_id: string) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    if (result && result.result !== "ok") {
      throw new Error(result.result);
    }
    return { result: "ok" };
  } catch (err: any) {
    console.error("cloudinary delete error:", err);
    throw new Error("cloudinary delete error: " + err.message);
  }
};
