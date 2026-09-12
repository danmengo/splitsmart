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
  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== 'string' || typeof body.paid !== 'boolean') {
    return NextResponse.json({ error: 'Provide a user and a boolean paid status' }, { status: 400 });
  }
  const { userId, paid } = body;

  // Only allow marking your own split as paid.
  if (userId !== user.id) {
    return NextResponse.json(
      { error: "You can only mark your own split as paid" },
      { status: 403 },
    );
  }

  const split = await prisma.expenseSplit.updateMany({
    where: { expenseId, userId, expense: { group: { members: { some: { userId: user.id } } } } },
    data: { paid },
  });

  if (!split.count) return NextResponse.json({ error: 'Split not found' }, { status: 404 });
  return NextResponse.json(split);
}
