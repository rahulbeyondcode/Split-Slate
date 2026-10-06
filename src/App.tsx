import { RouterProvider } from "react-router-dom";

import PwaProvider from "@/app/providers/pwa-provider";
import { router } from "@/app/router";
import DevTools from "@/features/dev-tools";

const App = () => (
  <>
    {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVTOOLS === "true") && <DevTools />}
    <PwaProvider>
      <RouterProvider router={router} />
    </PwaProvider>
  </>
);

export default App;
