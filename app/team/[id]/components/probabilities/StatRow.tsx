"use client";

import React, { useEffect, useState } from "react";

function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsCoarse(media.matches);
    update();

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return isCoarse;
}

export default function StatRow({
  label,
  count,
  percentGreen,
  percentBlue,
  percentOrange,
  highlight,
}: any) {
  const isCoarse = useCoarsePointer();
  const [showCount, setShowCount] = useState(false);

  const rowClass = `flex justify-between items-center text-sm py-1 px-2 -mx-2 rounded-md ${
    highlight ? "bg-yellow-400/10 ring-1 ring-yellow-300/40" : ""
  }`;
  const labelClass = highlight ? "text-yellow-100" : "";
  const countClass = highlight ? "text-yellow-200" : "text-white/25";
  const greenClass = highlight ? "text-yellow-300" : "text-green-400";
  const blueClass = "text-blue-400";
  const orangeClass = highlight ? "text-yellow-300" : "text-orange-400";

  useEffect(() => {
    if (!isCoarse && showCount) {
      setShowCount(false);
    }
  }, [isCoarse, showCount]);

  const handleToggle = () => {
    if (!isCoarse) return;
    setShowCount((prev) => !prev);
  };

  const percentBaseClass = `${isCoarse ? "cursor-pointer" : ""} font-semibold`;

  return (
    <div className={rowClass}>
      <div className="flex items-center gap-2">
        <span className={labelClass}>{label}</span>
        <span className={`${countClass} mobile-hide`}>{count}</span>
      </div>
      <div className="flex gap-2 items-center relative">
        <span className={`${greenClass} ${percentBaseClass}`} onClick={handleToggle}>
          {percentGreen}
        </span>
        <span className={`${blueClass} ${percentBaseClass}`} onClick={handleToggle}>
          {percentBlue}
        </span>
        {percentOrange != null ? (
          <span className={`${orangeClass} ${percentBaseClass}`} onClick={handleToggle}>
            {percentOrange}
          </span>
        ) : null}
        {isCoarse && showCount ? (
          <span className="absolute -top-6 right-0 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] text-white shadow">
            {count}
          </span>
        ) : null}
      </div>
    </div>
  );
}
