import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

const StepIdentity = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title mb-1">What do people call you?</h1>
        <p className="text-sm text-gray-500">This name appears when you add expenses.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label">Your name</label>
        <Input name="identity.name" placeholder="Enter your name" autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label">Pick your icon</label>
        <EmojiPicker name="identity.icon" emojis={PERSON_EMOJIS} />
      </div>
    </div>
  );
};

export default StepIdentity;
