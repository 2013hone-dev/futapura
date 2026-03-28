export const dynamic = 'force-dynamic';
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { CircleManager } from "./CircleManager";

export default async function CirclePage({ params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const myId = (session.user as any).id;

  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!circle) notFound();
  if (circle.ownerId !== myId) redirect("/circles");

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <CircleManager circle={circle} />
      </main>
      <ToastContainer />
    </>
  );
}
