import { useNavigate } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

export const useFinishOnboarding = () => {
  const navigate = useNavigate();
  const updateOnboarding = useStore((s) => s.updateOnboarding);

  return async () => {
    await updateOnboarding({ complete: true });
    navigate("/dashboard", { replace: true });
  };
};
