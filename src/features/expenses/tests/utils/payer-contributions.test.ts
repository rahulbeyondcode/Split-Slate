import { describe, expect, it } from "vitest";

import { previewPayerContributions } from "@/features/expenses/utils/payer-contributions";

const PAYERS = ["a", "b", "c", "d"].map((memberId) => ({ memberId, value: "" }));

describe("previewPayerContributions", () => {
  it("suggests the full amount for one payer and equal amounts for blanks", () => {
    expect(previewPayerContributions("100", PAYERS.slice(0, 1), "INR").paid).toEqual([
      { memberId: "a", amount: 10000 },
    ]);
    expect(previewPayerContributions("100", PAYERS, "INR").paid).toEqual(
      PAYERS.map(({ memberId }) => ({ memberId, amount: 2500 })),
    );
  });

  it("redistributes the remainder after each manually entered contribution", () => {
    const payers = PAYERS.map((payer, index) => ({ ...payer, value: index === 0 ? "40" : "" }));
    expect(previewPayerContributions("100", payers, "INR").paid).toEqual([
      { memberId: "a", amount: 4000 },
      { memberId: "b", amount: 2000 },
      { memberId: "c", amount: 2000 },
      { memberId: "d", amount: 2000 },
    ]);
    payers[1].value = "30";
    payers[2].value = "30";
    expect(previewPayerContributions("100", payers, "INR").paid.at(-1)?.amount).toBe(0);
  });

  it("reports an over-total amount immediately without making a negative suggestion", () => {
    const preview = previewPayerContributions(
      "100",
      [
        { memberId: "a", value: "110" },
        { memberId: "b", value: "" },
      ],
      "INR",
    );
    expect(preview.error).toBe("Payer amounts exceed the total");
    expect(preview.paid).toEqual([{ memberId: "a", amount: 11000 }]);
  });
});
