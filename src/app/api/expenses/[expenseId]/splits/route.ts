import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/expenses/:expenseId/splits - mark a split as paid/unpaid
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { expenseId } = await params;
  const { userId, paid } = await request.json();

  // Only allow marking your own split as paid, unless you're the group admin
  if (userId !== user.id) {
    return NextResponse.json(
      { error: "You can only mark your own split as paid" },
      { status: 403 },
    );
  }

  const split = await prisma.expenseSplit.updateMany({
    where: { expenseId, userId },
    data: { paid },
  });

  return NextResponse.json(split);
}
