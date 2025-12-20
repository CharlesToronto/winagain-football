import React from "react";

export default function StatRow({ label, count, percentGreen, percentBlue }: any) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <span className="text-white/25">{count}</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-green-400 font-semibold">{percentGreen}</span>
        <span className="text-blue-400 font-semibold">{percentBlue}</span>
      </div>
    </div>
  );
}
