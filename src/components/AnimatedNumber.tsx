import React, { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  formatFunc?: (val: number) => string;
  className?: string;
}

export default function AnimatedNumber({ value, formatFunc = (v) => v.toFixed(0), className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [motionValue, value, inView]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatFunc(springValue.get());
    }

    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatFunc(latest);
      }
    });
  }, [springValue, formatFunc]);

  return <span ref={ref} className={className}>{formatFunc(0)}</span>;
}
