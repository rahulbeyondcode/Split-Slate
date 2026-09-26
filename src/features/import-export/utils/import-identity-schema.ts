import { z } from "zod";

import { createRequiredStringSchema } from "@/shared/utils/string-validation";

export const importIdentitySchema = z
  .object({
    memberId: z.string().min(1, "Choose who you are"),
    name: z.string(),
    icon: z.string(),
  })
  .superRefine((values, context) => {
    if (values.memberId !== "new") return;
    const name = createRequiredStringSchema("Name is required").safeParse(values.name);
    const icon = createRequiredStringSchema("Icon is required").safeParse(values.icon);
    if (!name.success) {
      context.addIssue({ code: "custom", path: ["name"], message: "Name is required" });
    }
    if (!icon.success) {
      context.addIssue({ code: "custom", path: ["icon"], message: "Icon is required" });
    }
  });

export type ImportIdentityFormValues = z.infer<typeof importIdentitySchema>;
