/**
 * Image generation helper using internal ImageService
 *
 * NOTE: This feature is currently disabled as it requires Forge API configuration.
 * Storage has been migrated to Bunny.net CDN.
 *
 * To re-enable image generation:
 * 1. Configure FORGE_API_URL and FORGE_API_KEY
 * 2. Update the storage to use Bunny.net uploadFile API
 *
 * Example usage (when enabled):
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 */
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };

  // Convert base64 to buffer and upload to Bunny.net
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  // Generate filename with timestamp
  const timestamp = Date.now();
  const ext = result.image.mimeType.split("/")[1] || "png";
  const fileName = `generated-${timestamp}.${ext}`;

  // Upload to Bunny.net Storage
  try {
    if (!ENV.bunnyApiKey) {
      console.warn("[ImageGen] Bunny API key not configured, returning base64 data URL");
      const dataUrl = `data:${result.image.mimeType};base64,${base64Data}`;
      return { url: dataUrl };
    }

    // Upload to "generated-images" folder
    const folder = "generated-images";
    const path = `/${ENV.bunnyStorageZone}/${folder}/${fileName}`;
    const uploadUrl = `https://storage.bunnycdn.com${path}`;

    console.log(`[ImageGen] 📤 Uploading to Bunny.net: ${fileName}`);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: ENV.bunnyApiKey,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Bunny upload failed: ${uploadResponse.statusText}`);
    }

    const publicUrl = `${ENV.bunnyCdnUrl}/${folder}/${fileName}`;
    console.log(`[ImageGen] ✅ Uploaded to Bunny.net: ${publicUrl}`);

    return { url: publicUrl };
  } catch (uploadError) {
    console.error("[ImageGen] Bunny upload error, falling back to base64:", uploadError);
    const dataUrl = `data:${result.image.mimeType};base64,${base64Data}`;
    return { url: dataUrl };
  }
}
