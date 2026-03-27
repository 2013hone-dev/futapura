"use client";
import { useEffect, useState } from "react";

type Stamp = { id: string; name: string; emoji: string | null };
type Pack = { id: string; name: string; stamps: Stamp[] };

type Props = { onSelect: (stamp: Stamp) => void; onClose: () => void };

export function StampPicker({ onSelect, onClose }: Props) {
  const [packs, setPacks] = useState<Pack[]>([]);

  useEffect(() => {
    fetch("/api/stamps").then((r) => r.json()).then(setPacks);
  }, []);

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-20 w-72">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-gray-700">スタンプ</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
      {packs.map((pack) => (
        <div key={pack.id}>
          <p className="text-xs text-gray-400 mb-2">{pack.name}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {pack.stamps.map((stamp) => (
              <button
                key={stamp.id}
                onClick={() => { onSelect(stamp); onClose(); }}
                title={stamp.name}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {stamp.emoji || "🎭"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
