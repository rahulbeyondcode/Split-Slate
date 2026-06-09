import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

const StepIdentity = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">What should we call you?</h2>
        <p className="text-sm text-gray-500">This name appears when you add expenses.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Your name</label>
        <Input name="identity.name" placeholder="Enter your name" autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Pick an icon</label>
        <EmojiPicker name="identity.icon" emojis={PERSON_EMOJIS} />
      </div>
    </div>
  );
};

export default StepIdentity;
