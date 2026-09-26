import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { GROUP_EMOJIS } from "@/shared/constants/emojis";

interface PropsType {
  title?: string;
  subtitle?: string;
}

const StepGroup = ({
  title = "Create your first group",
  subtitle = "A group holds all expenses between a set of people.",
}: PropsType) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="page-title mb-1">{title}</h2>
        <p className="soft-caption">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label">Group name</label>
        <Input name="group.name" placeholder="e.g. Goa Trip, Flatmates, Family" autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label">Group icon</label>
        <EmojiPicker name="group.icon" emojis={GROUP_EMOJIS} />
      </div>
    </div>
  );
};

export default StepGroup;
