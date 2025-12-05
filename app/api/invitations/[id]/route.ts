import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.organization_invitations.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete invite error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { roleId } = body;

        if (!roleId) {
            return NextResponse.json({ error: "Missing roleId" }, { status: 400 });
        }

        const updated = await prisma.organization_invitations.update({
            where: { id: params.id },
            data: {
                target_role_id: roleId,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error("Update invite error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}