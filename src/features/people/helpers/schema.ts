import { z } from "zod";

// Validation for the person editor (friends list). `existingNames` excludes the person being
// edited so renaming to the same name is allowed; pass all other people's names to block duplicates.
export const createPersonSchema = (existingNames: string[]) =>
  z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .refine(
        (val) => !existingNames.some((n) => n.toLowerCase() === val.trim().toLowerCase()),
        "Someone with this name already exists",
      ),
    icon: z.string(),
  });

export type PersonEditorValues = z.infer<ReturnType<typeof createPersonSchema>>;
