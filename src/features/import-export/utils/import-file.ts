import { parsePortableGroupCsv } from "@/features/import-export/utils/export-csv";
import { parsePortableGroupZip } from "@/features/import-export/utils/export-zip";

import type { GroupTransferSource } from "@/features/import-export/types/import-export.types";

export const parseGroupTransferFile = async (file: File): Promise<GroupTransferSource> => {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv") {
    const bundle = await parsePortableGroupCsv(await file.text());
    if (bundle.manifest.selection.attachments || bundle.attachments.length) {
      throw new Error("Receipt attachments require a ZIP transfer");
    }
    return { bundle, attachmentFiles: [] };
  }
  if (extension === "zip") {
    return parsePortableGroupZip(new Uint8Array(await file.arrayBuffer()));
  }
  throw new Error("Choose a Split Slate CSV or ZIP transfer file");
};
