import { useEffect, useState } from "react";
import App from "./App";
import { tuberian } from "./themes/tuberian";
import { ThemeProvider } from "./themes/ThemeProvider";
import { WorldsPage } from "./worlds/WorldsPage";

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

// "#map/inbox-helper" opens that world's map; "#map" opens the default one; anything else shows Worlds.
function mapIdFrom(hash: string): string | null {
  if (hash === "#map") return "";
  if (!hash.startsWith("#map/")) return null;
  const id = hash.slice("#map/".length);
  return SLUG.test(id) ? id : null;
}

export function Root() {
  const [hash, setHash] = useState(() => window.location.hash);
  // Subscribe to URL hash changes so links and the back button swap screens without a reload.
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const mapId = mapIdFrom(hash);
  if (mapId !== null) return <App key={mapId} initialSystemId={mapId || undefined} />;

  return (
    <ThemeProvider pack={tuberian}>
      <WorldsPage onOpen={(id) => (window.location.hash = `#map/${id}`)} />
    </ThemeProvider>
  );
}
