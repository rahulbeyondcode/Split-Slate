import { strFromU8, strToU8, unzlibSync, zlibSync } from "fflate";

import { verifyPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import {
  MAX_DECODED_LINK_BYTES,
  MAX_TRANSFER_URL_LENGTH,
} from "@/features/import-export/constants/export.constants";
import type { PortableGroup } from "@/features/import-export/types/import-export.types";

export class TransferLinkTooLargeError extends Error {
  readonly length: number | null;

  constructor(length: number | null = null) {
    super(
      length === null
        ? "Transfer data exceeds the safe decoded-size limit"
        : `Transfer link is ${length} characters; the supported limit is ${MAX_TRANSFER_URL_LENGTH}`,
    );
    this.name = "TransferLinkTooLargeError";
    this.length = length;
  }
}

const encodeBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
};

const decodeBase64Url = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("Transfer link payload is malformed");
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const encodeTransferPayload = async (bundle: PortableGroup): Promise<string> => {
  const validated = await verifyPortableGroup(bundle);
  if (validated.manifest.selection.attachments) {
    throw new Error("Receipt attachments require a ZIP transfer");
  }
  const decoded = strToU8(JSON.stringify(validated));
  if (decoded.byteLength > MAX_DECODED_LINK_BYTES) throw new TransferLinkTooLargeError();
  return `v1.${encodeBase64Url(zlibSync(decoded, { level: 9 }))}`;
};

export const decodeTransferPayload = async (hash: string): Promise<PortableGroup> => {
  const payload = hash.replace(/^#/u, "");
  if (payload.length > MAX_TRANSFER_URL_LENGTH)
    throw new Error("Transfer link payload is too large");
  if (!payload.startsWith("v1.")) throw new Error("Unsupported transfer-link version");
  let decoded: Uint8Array;
  try {
    decoded = unzlibSync(decodeBase64Url(payload.slice(3)));
  } catch {
    throw new Error("Transfer link payload could not be decoded");
  }
  if (decoded.byteLength > MAX_DECODED_LINK_BYTES) {
    throw new Error("Transfer link payload is too large");
  }
  try {
    return await verifyPortableGroup(JSON.parse(strFromU8(decoded)));
  } catch (failure) {
    if (failure instanceof Error && failure.message === "Transfer integrity check failed") {
      throw failure;
    }
    throw new Error("Transfer link contains invalid group data", { cause: failure });
  }
};

export const createTransferLink = async (
  bundle: PortableGroup,
  appBaseUrl: string,
): Promise<string> => {
  const url = new URL("import", appBaseUrl.endsWith("/") ? appBaseUrl : `${appBaseUrl}/`);
  url.hash = await encodeTransferPayload(bundle);
  const result = url.toString();
  if (result.length > MAX_TRANSFER_URL_LENGTH) throw new TransferLinkTooLargeError(result.length);
  return result;
};
