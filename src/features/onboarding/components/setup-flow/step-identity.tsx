import { useWatch } from "react-hook-form";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

const IDENTITY_EMOJIS = ["🦊", "🐯", "🦋", "🐼", "🐙", "🐨", "🦜", "🐠", "🦄", "🦖", "🌸", "⚡"];

const StepIdentity = () => {
  const selectedIcon = useWatch({ name: "identity.icon" });
  const emojis =
    selectedIcon && !IDENTITY_EMOJIS.includes(selectedIcon)
      ? [...IDENTITY_EMOJIS, selectedIcon]
      : IDENTITY_EMOJIS;

  return (
    <div className="onboarding-fields">
      <div className="onboarding-field">
        <label className="field-label" htmlFor="onboarding-name">
          Your name
        </label>
        <Input id="onboarding-name" name="identity.name" placeholder="Enter your name" autoFocus />
      </div>

      <div className="onboarding-field onboarding-emoji-field">
        <span className="field-label">Pick your emoji</span>
        <EmojiPicker name="identity.icon" emojis={emojis} />
      </div>
    </div>
  );
};

export default StepIdentity;
