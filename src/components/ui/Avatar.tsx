import Image from "next/image";

const COLORS = [
  "#4A90D9","#E67E22","#27AE60","#8E44AD","#C0392B",
  "#16A085","#2980B9","#D35400","#7D3C98","#1ABC9C",
];

function colorFromStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

type Props = { user: { displayName: string; avatarUrl?: string | null }; size?: number; className?: string };

export function Avatar({ user, size = 40, className = "" }: Props) {
  const initials = user.displayName.slice(0, 2);
  const bg = colorFromStr(user.displayName);

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.displayName}
        width={size} height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-medium select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
