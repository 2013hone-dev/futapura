"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" };
let listeners: ((t: Toast) => void)[] = [];

export function toast(message: string, type: "success" | "error" = "success") {
  listeners.forEach((fn) => fn({ id: Date.now(), message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts((p) => [...p, t]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 3000);
    };
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg transition-all ${
            t.type === "error" ? "bg-red-500" : "bg-gray-900"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
