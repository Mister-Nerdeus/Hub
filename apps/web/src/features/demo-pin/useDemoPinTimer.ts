import { useEffect } from "react";

export function useDemoPinTimer(active: boolean, onTick: () => void): void {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const intervalId = window.setInterval(onTick, 250);
    return () => window.clearInterval(intervalId);
  }, [active, onTick]);
}
