"use client";

import React, { useEffect, useState } from "react";

function useMobileMode() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(coarse.matches || narrow.matches);
    update();

    if (coarse.addEventListener) {
      coarse.addEventListener("change", update);
      narrow.addEventListener("change", update);
      return () => {
        coarse.removeEventListener("change", update);
        narrow.removeEventListener("change", update);
      };
    }
    coarse.addListener(update);
    narrow.addListener(update);
    return () => {
      coarse.removeListener(update);
      narrow.removeListener(update);
    };
  }, []);

  return isMobile;
}

export default function StatRow({
  label,
  count,
  percentGreen,
  percentBlue,
  percentOrange,
  highlight,
}: any) {
  const isMobile = useMobileMode();
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
    if (!isMobile && showCount) {
      setShowCount(false);
    }
  }, [isMobile, showCount]);

  const handleToggle = () => {
    if (!isMobile) return;
    setShowCount((prev) => !prev);
  };

  const percentBaseClass = `${isMobile ? "cursor-pointer" : ""} font-semibold`;

  return (
    <div className={rowClass}>
      <div className="flex items-center gap-2">
        <span className={labelClass}>{label}</span>
        {!isMobile ? (
          <span className={`${countClass} hidden md:inline mobile-hide`}>{count}</span>
        ) : null}
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
        {isMobile && showCount ? (
          <span className="absolute -top-6 right-0 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] text-white shadow">
            {count}
          </span>
        ) : null}
      </div>
    </div>
  );
}
