import React from "react";

export default function StatRow({ label, count, percentGreen, percentBlue }: any) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span>{label}</span>
      <div className="flex gap-2 items-center">
        <span className="text-white/70">{count}</span>
        <span className="text-green-400 font-semibold">{percentGreen}</span>
        <span className="text-blue-400 font-semibold">{percentBlue}</span>
      </div>
    </div>
  );
}
