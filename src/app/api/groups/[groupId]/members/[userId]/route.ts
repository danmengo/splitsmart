import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/groups/:groupId/members/:userId - admin removes a member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; userId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, userId } = await params;

  // Verify the person making the request is an admin
  const requester = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!requester || requester.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can remove members" },
      { status: 403 },
    );
  }

  // Prevent admin from removing themselves
  if (userId === user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself. Delete the group instead." },
      { status: 400 },
    );
  }

  // Check the member exists
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  // Notify the removed user
  await prisma.notification.create({
    data: {
      userId,
      message: `You have been removed from a group`,
    },
  });

  return NextResponse.json({ success: true });
}
