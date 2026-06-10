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
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Group name</label>
        <Input name="group.name" placeholder="e.g. Goa Trip, Flatmates, Family" autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Pick an icon</label>
        <EmojiPicker name="group.icon" emojis={GROUP_EMOJIS} />
      </div>
    </div>
  );
};

export default StepGroup;
