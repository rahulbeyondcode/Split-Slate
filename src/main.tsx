import "./index.css";

import { createRoot } from "react-dom/client";

import { useStore } from "@/shared/configs/store";

import App from "./App.tsx";

useStore.getState().init();

createRoot(document.getElementById("root")!).render(<App />);
