import React from "react";

export default function StatRow({
  label,
  count,
  percentGreen,
  percentBlue,
  percentOrange,
  highlight,
}: any) {
  const rowClass = `flex justify-between items-center text-sm py-1 px-2 -mx-2 rounded-md ${
    highlight ? "bg-yellow-400/10 ring-1 ring-yellow-300/40" : ""
  }`;
  const labelClass = highlight ? "text-yellow-100" : "";
  const countClass = highlight ? "text-yellow-200" : "text-white/25";
  const greenClass = highlight ? "text-yellow-300" : "text-green-400";
  const blueClass = "text-blue-400";
  const orangeClass = highlight ? "text-yellow-300" : "text-orange-400";

  return (
    <div className={rowClass}>
      <div className="flex items-center gap-2">
        <span className={labelClass}>{label}</span>
        <span className={countClass}>{count}</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className={`${greenClass} font-semibold`}>{percentGreen}</span>
        <span className={`${blueClass} font-semibold`}>{percentBlue}</span>
        {percentOrange != null ? (
          <span className={`${orangeClass} font-semibold`}>{percentOrange}</span>
        ) : null}
      </div>
    </div>
  );
}
