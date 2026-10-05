import { z } from "zod";

import { portableGroupSchema } from "@/features/import-export/utils/portable-group-schema";

import type { PortableGroup } from "@/features/import-export/types/import-export.types";

type UnsealedPortableGroup = Omit<PortableGroup, "manifest"> & {
  manifest: Omit<PortableGroup["manifest"], "integrity">;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

const integrityInput = (bundle: PortableGroup | UnsealedPortableGroup): UnsealedPortableGroup => {
  const { integrity, ...manifest } = bundle.manifest as PortableGroup["manifest"];
  void integrity;
  return { ...bundle, manifest };
};

export const canonicalTransferJson = (bundle: PortableGroup): string =>
  JSON.stringify(canonicalize(bundle));

export const digestBytes = async (bytes: Uint8Array<ArrayBufferLike>): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const createTransferDigest = async (
  bundle: PortableGroup | UnsealedPortableGroup,
): Promise<string> =>
  digestBytes(new TextEncoder().encode(JSON.stringify(canonicalize(integrityInput(bundle)))));

export const sealPortableGroup = async (bundle: UnsealedPortableGroup): Promise<PortableGroup> =>
  portableGroupSchema.parse({
    ...bundle,
    manifest: {
      ...bundle.manifest,
      integrity: { algorithm: "SHA-256", digest: await createTransferDigest(bundle) },
    },
  });

export const verifyPortableGroup = async (value: unknown): Promise<PortableGroup> => {
  const legacy = z
    .object({
      schemaVersion: z.literal(1),
      manifest: z
        .object({
          integrity: z.object({
            algorithm: z.literal("SHA-256"),
            digest: z.string().regex(/^[0-9a-f]{64}$/u),
          }),
        })
        .passthrough(),
    })
    .passthrough()
    .safeParse(value);
  if (legacy.success) {
    if (
      (await createTransferDigest(legacy.data as unknown as PortableGroup)) !==
      legacy.data.manifest.integrity.digest
    ) {
      throw new Error("Transfer integrity check failed");
    }
    const source = legacy.data as unknown as Record<string, unknown>;
    const manifest = source.manifest as Record<string, unknown>;
    const normalized = portableGroupSchema.parse({
      ...source,
      schemaVersion: 2,
      settlements: [],
      manifest: {
        ...manifest,
        sourceCounts: { ...(manifest.sourceCounts as object), settlements: 0 },
        includedCounts: { ...(manifest.includedCounts as object), settlements: 0 },
      },
    });
    const { integrity, ...unsignedManifest } = normalized.manifest;
    void integrity;
    return sealPortableGroup({ ...normalized, manifest: unsignedManifest });
  }
  const bundle = portableGroupSchema.parse(value);
  const digest = await createTransferDigest(bundle);
  if (digest !== bundle.manifest.integrity.digest) {
    throw new Error("Transfer integrity check failed");
  }
  return bundle;
};
