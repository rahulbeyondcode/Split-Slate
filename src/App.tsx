import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";
import DevTools from "@/features/dev-tools";

const App = () => (
  <>
    {import.meta.env.DEV && <DevTools />}
    <RouterProvider router={router} />
  </>
);

export default App;
