import { z } from "zod";

import { createRequiredStringSchema } from "@/shared/utils/string-validation";

// Validation for the person editor (friends list). `existingNames` excludes the person being
// edited so renaming to the same name is allowed; pass all other people's names to block duplicates.
export const createPersonSchema = (existingNames: string[]) =>
  z.object({
    name: createRequiredStringSchema("Name is required").refine(
      (value) =>
        !existingNames.some(
          (existingName) => existingName.trim().toLowerCase() === value.toLowerCase(),
        ),
      "Someone with this name already exists",
    ),
    icon: createRequiredStringSchema("Icon is required"),
  });

export type PersonEditorValues = z.infer<ReturnType<typeof createPersonSchema>>;
