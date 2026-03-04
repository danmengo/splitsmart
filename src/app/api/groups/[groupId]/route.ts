import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group)
    return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Make sure the logged in user is actually in this group
  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(group);
}

// DELETE /api/groups/:groupId - admin only
export async function DELETE(
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

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!member || member.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can delete groups" },
      { status: 403 },
    );
  }

  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}

// PATCH /api/groups/:groupId - leave group
export async function PATCH(
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

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!member)
    return NextResponse.json(
      { error: "You are not in this group" },
      { status: 404 },
    );

  if (member.role === "admin") {
    return NextResponse.json(
      {
        error: "Admins cannot leave their own group. Delete the group instead.",
      },
      { status: 400 },
    );
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  return NextResponse.json({ success: true });
}
