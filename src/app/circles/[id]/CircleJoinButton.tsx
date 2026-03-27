"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

export function CircleJoinButton({ circleId, isMember: init, isLoggedIn }: {
  circleId: string; isMember: boolean; isLoggedIn: boolean;
}) {
  const [isMember, setIsMember] = useState(init);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isLoggedIn) return null;

  const handle = async () => {
    setLoading(true);
    const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
    const data = await res.json();
    if (data.error) { toast(data.error, "error"); setLoading(false); return; }
    setIsMember(data.joined);
    toast(data.joined ? "参加しました！" : "退出しました");
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={handle} disabled={loading}
      className={isMember ? "btn-secondary text-sm" : "btn-primary text-sm"}>
      {loading ? "..." : isMember ? "参加中" : "参加する"}
    </button>
  );
}
