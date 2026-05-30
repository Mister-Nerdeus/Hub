import { useEffect, useState } from "react";
import { checkRuntimeEditorCapabilities } from "./runtimeCapabilityCheck";

export function RuntimeMismatchBanner() {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      const result = checkRuntimeEditorCapabilities();
      setMissing(result.missing);
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (missing.length === 0) {
    return null;
  }

  return (
    <section
      className="runtime-mismatch-banner"
      role="alert"
      data-runtime-mismatch-banner="true"
      data-missing-capabilities={missing.join(", ")}
    >
      <strong>Runtime mismatch detected.</strong>
      <span>
        This editor is missing expected save controls: {missing.join(", ")}.
        Stop the dev server, pull latest, restart npm run dev, then hard refresh.
      </span>
    </section>
  );
}
