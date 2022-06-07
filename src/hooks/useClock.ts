import { useEffect, useState } from "react";

export function useClock(): number {
  const [now, setTime] = useState(() => Date.now());

  useEffect(() => {
    const loop = () => {
      setTime(Date.now());
    };
    let timeId = setInterval(loop, 10000);
    return () => {
      clearInterval(timeId);
    };
  }, []);

  return now;
}
