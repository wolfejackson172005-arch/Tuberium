import { useEffect, useState } from "react";
import App from "./App";
import { tuberian } from "./themes/tuberian";
import { ThemeProvider } from "./themes/ThemeProvider";
import { WorldsPage } from "./worlds/WorldsPage";

// Until the World cards' buttons work, the live map lives at #map and Worlds is the default screen.
export function Root() {
  const [hash, setHash] = useState(() => window.location.hash);
  // Subscribe to URL hash changes so typing #map in the address bar swaps screens without a reload.
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (hash === "#map") return <App />;
  return (
    <ThemeProvider pack={tuberian}>
      <WorldsPage />
    </ThemeProvider>
  );
}
