// app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MessageType, MessageStatus, ThreadType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ✅ GET MESSAGES FOR A THREAD (CONVERSATION) */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // Pagination cursor
    const after = searchParams.get("after");

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user is a member of the thread
    const membership = await prisma.chatThreadMember.findFirst({
      where: {
        threadId: conversationId,
        userId: user.id,
        leftAt: null,
      },
      include: {
        thread: {
          select: {
            id: true,
            threadType: true,
            title: true,
            lastMessageAt: true,
            organizationId: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this conversation" },
        { status: 403 }
      );
    }

    // Build where clause for pagination
    const whereClause: any = { threadId: conversationId };
    
    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }
    if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            avatarUrl: true,
            userType: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileUrl: true,
            cdnUrl: true,
            fileName: true,
            mimeType: true,
            fileSizeBytes: true,
            thumbnailUrl: true,
          },
        },
        reads: {
          where: {
            userId: user.id,
          },
          select: {
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== user.id && msg.reads.length === 0)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(messageId => ({
          messageId,
          userId: user.id,
          organizationId: membership.thread.organizationId || "", // You might need to store orgId on thread
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });

      // Update thread member's unread count
      await prisma.chatThreadMember.update({
        where: {
          threadId_userId: {
            threadId: conversationId,
            userId: user.id,
          },
        },
        data: {
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      });
    }

    // Get message reactions (if you have reactions for messages)
    const messageIds = messages.map(m => m.id);
    const reactions = await prisma.reaction.findMany({
      where: {
        entityType: "message",
        entityId: { in: messageIds },
      },
      select: {
        entityId: true,
        emoji: true,
        userId: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Group reactions by message
    const reactionsByMessage = new Map();
    reactions.forEach(reaction => {
      if (!reactionsByMessage.has(reaction.entityId)) {
        reactionsByMessage.set(reaction.entityId, []);
      }
      reactionsByMessage.get(reaction.entityId).push({
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.fullName,
      });
    });

    // Enhance messages with additional data
    const enhancedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      contentHtml: msg.contentHtml,
      messageType: msg.messageType,
      status: msg.status,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
      isPinned: msg.isPinned,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sender: {
        id: msg.sender.id,
        name: msg.sender.fullName,
        avatar: msg.sender.avatarUrl,
        userType: msg.sender.userType,
      },
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content?.substring(0, 100),
        senderName: msg.replyTo.sender.fullName,
      } : null,
      attachments: msg.attachments,
      reactions: reactionsByMessage.get(msg.id) || [],
      isRead: msg.reads.length > 0,
      isOwnMessage: msg.senderId === user.id,
    }));

    // Get thread participants
    const participants = await prisma.chatThreadMember.findMany({
      where: {
        threadId: conversationId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            avatarUrl: true,
            userType: true,
            status: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Get typing indicators (simplified - would need real-time for production)
    const typingUsers: any[] = [];

    return NextResponse.json({
      success: true,
      messages: enhancedMessages,
      thread: {
        id: membership.thread.id,
        type: membership.thread.threadType,
        title: membership.thread.title,
        lastMessageAt: membership.thread.lastMessageAt,
      },
      participants: participants.map(p => ({
        id: p.user.id,
        name: p.user.fullName,
        avatar: p.user.avatarUrl,
        userType: p.user.userType,
        isOnline: p.user.lastSeenAt 
          ? new Date(p.user.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000
          : false,
        role: p.role,
      })),
      typingUsers,
      pagination: {
        limit,
        hasMore: messages.length === limit,
        nextCursor: messages.length === limit ? messages[messages.length - 1].createdAt : null,
      },
    });
  } catch (error: any) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/* ✅ SEND NEW MESSAGE */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const body = await req.json();
    const {
      content,
      messageType = "text",
      replyToMessageId,
      attachments = [],
    } = body;

    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message content or attachment required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user is a member of the thread
    const membership = await prisma.chatThreadMember.findFirst({
      where: {
        threadId: conversationId,
        userId: user.id,
        leftAt: null,
      },
      include: {
        thread: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this conversation" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          threadId: conversationId,
          senderId: user.id,
          organizationId: (membership.thread.organizationId || user.organizationId) as string,
          content: content || null,
          messageType: messageType as MessageType,
          replyToMessageId: replyToMessageId || null,
          status: MessageStatus.sent,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Create attachments if provided
      if (attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((att: any) => ({
            messageId: newMessage.id,
            organizationId: (membership.thread.organizationId || user.organizationId) as string,
            fileUrl: att.url,
            fileName: att.name,
            mimeType: att.type,
            fileSizeBytes: att.size,
            thumbnailUrl: att.thumbnailUrl || null,
          })),
        });
      }

      // Update thread's last message
      await tx.chatThread.update({
        where: { id: conversationId },
        data: {
          lastMessageId: newMessage.id,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      // Update unread counts for all other members
      const otherMembers = await tx.chatThreadMember.findMany({
        where: {
          threadId: conversationId,
          userId: { not: user.id },
          leftAt: null,
        },
        select: { userId: true },
      });

      for (const member of otherMembers) {
        await tx.chatThreadMember.update({
          where: {
            threadId_userId: {
              threadId: conversationId,
              userId: member.userId,
            },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });

        // Create notification for other members
        await tx.notification.create({
          data: {
            userId: member.userId,
            organizationId: (membership.thread.organizationId || user.organizationId) as string,
            type: "new_message",
            category: "social",
            title: "New Message",
            body: `${user.fullName} sent you a message`,
            payload: {
              threadId: conversationId,
              messageId: newMessage.id,
              senderId: user.id,
            },
            actionUrl: `/dashboard/messages/${conversationId}`,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: (membership.thread.organizationId || user.organizationId) as string,
          actorId: user.id,
          action: "message.sent",
          entityType: "message",
          entityId: newMessage.id,
          severity: "info",
        },
      });

      return newMessage;
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.fullName,
          avatar: message.sender.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/* ✅ DELETE/EDIT MESSAGE */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const action = searchParams.get("action"); // edit, delete
    const body = await req.json().catch(() => ({}));
    const { content } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ["clerkId"],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        fullName: true,
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        thread: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!message || message.threadId !== conversationId) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check permission (only sender or admin can edit/delete)
    const isSender = message.senderId === user.id;
    const isSuperAdmin = user.userType === "super_admin";
    
    // Check if user is admin in the organization
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        organizationId: message.thread.organizationId,
        role: { slug: { in: ["admin", "super-admin"] } },
      },
    });
    const isAdmin = !!userRole;

    if (!isSender && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to modify this message" },
        { status: 403 }
      );
    }

    let updatedMessage = null;

    if (action === "edit") {
      if (!content) {
        return NextResponse.json(
          { error: "Content required for edit" },
          { status: 400 }
        );
      }

      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
          editedAt: new Date(),
        },
      });
    } else if (action === "delete") {
      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          content: isSender ? "[Message deleted]" : "[Message removed by moderator]",
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'edit' or 'delete'" },
        { status: 400 }
      );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: message.thread.organizationId,
        actorId: user.id,
        action: `message.${action}`,
        entityType: "message",
        entityId: messageId,
        severity: action === "delete" ? "warning" : "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error: any) {
    console.error("Message action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}