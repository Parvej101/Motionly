import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { ASPECT_DIMENSIONS, type AspectRatio } from "@/remotion/types";
import { getImagePath } from "./tempfiles";
import { ValidationError } from "./validation";

export const prepareImages = async (input: {
  files: File[];
  aspectRatio: AspectRatio;
  jobId: string;
}): Promise<string[]> => {
  const { width, height } = ASPECT_DIMENSIONS[input.aspectRatio];
  const dataUrls: string[] = [];

  for (const [index, file] of input.files.entries()) {
    const source = Buffer.from(await file.arrayBuffer());

    let output: Buffer;
    try {
      output = await sharp(source, { failOn: "error" })
        .rotate()
        .resize({
          width,
          height,
          fit: "cover",
          position: sharp.strategy.attention,
        })
        .flatten({ background: "#0b0b10" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch {
      throw new ValidationError(`Could not process image ${index + 1}. Try a different file.`);
    }

    await writeFile(getImagePath(input.jobId, index), output);
    dataUrls.push(`data:image/jpeg;base64,${output.toString("base64")}`);
  }

  return dataUrls;
};
