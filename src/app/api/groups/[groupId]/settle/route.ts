import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/groups/:groupId/settle - settle up between current user and another user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const { withUserId } = await request.json();

  // Mark all unpaid splits as paid between these two users in this group
  await prisma.$transaction(async (tx) => {
    // Mark current user's splits as paid on expenses paid by the other user
    await tx.expenseSplit.updateMany({
      where: {
        userId: user.id,
        paid: false,
        expense: {
          groupId,
          paidById: withUserId,
        },
      },
      data: { paid: true },
    });

    // Mark other user's splits as paid on expenses paid by current user
    await tx.expenseSplit.updateMany({
      where: {
        userId: withUserId,
        paid: false,
        expense: {
          groupId,
          paidById: user.id,
        },
      },
      data: { paid: true },
    });

    // Notify the other user
    await tx.notification.create({
      data: {
        userId: withUserId,
        message: `All debts between you and ${user.user_metadata.full_name ?? user.email} have been settled!`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
