import { useEffect, useState } from "react";

export function useClock(): number {
  const [now, setTime] = useState(() => Date.now());

  useEffect(() => {
    const loop = () => {
      setTime(Date.now());
      setTimeout(loop, 1000);
    };

    setTimeout(loop, 1000);
  }, []);

  return now;
}
