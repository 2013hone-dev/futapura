export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { CircleList } from "@/components/circle/CircleList";
import { redirect } from "next/navigation";

export default async function CirclesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const ownerId = (session.user as any).id;
  const circles = await prisma.circle.findMany({
    where: { ownerId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <CircleList circles={circles} />
      </main>
      <ToastContainer />
    </>
  );
}
