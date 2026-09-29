import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

const StepIdentity = () => {
  return (
    <div className="onboarding-fields">
      <div className="onboarding-field">
        <label className="field-label" htmlFor="onboarding-name">
          Your name
        </label>
        <Input id="onboarding-name" name="identity.name" placeholder="Enter your name" autoFocus />
      </div>

      <div className="onboarding-field onboarding-emoji-field">
        <span className="field-label">Pick your avatar</span>
        <EmojiPicker name="identity.icon" kind="profile" emojis={PERSON_EMOJIS} />
      </div>
    </div>
  );
};

export default StepIdentity;
