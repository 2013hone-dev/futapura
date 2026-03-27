export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}
