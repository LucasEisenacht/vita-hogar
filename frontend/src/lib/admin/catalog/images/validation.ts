export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGE_COUNT = 8;
export const MAX_PRODUCT_IMAGE_SIZE = 8 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BATCH_SIZE = 9 * 1024 * 1024;

const allowedImageTypes: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const allowedExtensions = new Set(["avif", "jpeg", "jpg", "png", "webp"]);

export function isAllowedImageMimeType(type: string) {
  return Object.hasOwn(allowedImageTypes, type);
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return extension;
}

export function getSafeImageExtension(file: File) {
  const extension = getFileExtension(file.name);

  if (!isAllowedImageMimeType(file.type) || !allowedExtensions.has(extension)) {
    return null;
  }

  if (file.type === "image/jpeg") {
    return extension === "jpeg" ? "jpeg" : "jpg";
  }

  return allowedImageTypes[file.type];
}

export function normalizeImageFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const normalized = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "imagen";
}

export function validateImageFile(file: File) {
  if (file.size === 0) {
    return "El archivo esta vacio.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return "La imagen supera el maximo de 8 MB.";
  }

  if (!getSafeImageExtension(file)) {
    return "El formato no esta permitido.";
  }

  return null;
}

export function validateImageBatchPayloadSize(files: Array<File>) {
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  if (totalSize <= MAX_PRODUCT_IMAGE_BATCH_SIZE) {
    return null;
  }

  return "Subi menos imagenes por vez. El envio completo no puede superar 9 MB.";
}

function startsWithBytes(bytes: Uint8Array, signature: Array<number>) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function hasAsciiSignature(bytes: Uint8Array, offset: number, signature: string) {
  return signature
    .split("")
    .every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

function matchesImageSignature(file: File, bytes: Uint8Array) {
  if (file.type === "image/jpeg") {
    return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  }

  if (file.type === "image/png") {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (file.type === "image/webp") {
    return (
      hasAsciiSignature(bytes, 0, "RIFF") &&
      hasAsciiSignature(bytes, 8, "WEBP")
    );
  }

  if (file.type === "image/avif") {
    return (
      hasAsciiSignature(bytes, 4, "ftyp") &&
      (hasAsciiSignature(bytes, 8, "avif") ||
        hasAsciiSignature(bytes, 8, "avis") ||
        hasAsciiSignature(bytes, 8, "mif1"))
    );
  }

  return false;
}

export async function validateImageFileSignature(file: File) {
  const basicValidationMessage = validateImageFile(file);

  if (basicValidationMessage) {
    return basicValidationMessage;
  }

  const headerBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (!matchesImageSignature(file, headerBytes)) {
    return "El contenido de la imagen no coincide con el formato declarado.";
  }

  return null;
}
