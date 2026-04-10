// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ThreadType, MessageType, MessageStatus, ThreadMemberRole } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

/* ✅ SEND A MESSAGE / CREATE CONVERSATION */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        avatarUrl: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      receiverId,
      content,
      threadId: existingThreadId,
      messageType = "text",
      replyToMessageId,
      attachments = [],
      metadata = {},
    } = body;

    // Validate content or attachments
    if ((!content || !content.trim()) && attachments.length === 0) {
      return NextResponse.json(
        { error: "Message content or attachments are required" },
        { status: 400 }
      );
    }

    let threadId = existingThreadId;

    // If no thread ID, check if a 1:1 thread exists or create one
    if (!threadId && receiverId) {
      // Check for existing direct message thread between these users
      const existingThread = await prisma.chatThread.findFirst({
        where: {
          threadType: ThreadType.direct,
          organizationId: user.organizationId,
          members: {
            every: {
              userId: { in: [user.id, receiverId] },
            },
          },
          AND: [
            { members: { some: { userId: user.id } } },
            { members: { some: { userId: receiverId } } },
          ],
        },
        select: {
          id: true,
          members: {
            where: {
              userId: receiverId,
            },
            select: {
              isMuted: true,
              mutedUntil: true,
            },
          },
        },
      });

      if (existingThread) {
        threadId = existingThread.id;
        
        // Check if receiver has muted the conversation
        const receiverMember = existingThread.members[0];
        if (receiverMember?.isMuted && receiverMember.mutedUntil && new Date(receiverMember.mutedUntil) > new Date()) {
          // Still create the message but don't send notification
          // Notification will be handled but muted user won't receive it
        }
      } else {
        // Verify receiver exists and is in the same organization
        const receiver = await prisma.user.findFirst({
          where: {
            id: receiverId,
            organizationId: user.organizationId,
            status: "active",
          },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        });

        if (!receiver) {
          return NextResponse.json(
            { error: "Receiver not found or not in your organization" },
            { status: 404 }
          );
        }

        // Create new direct thread
        const newThread = await prisma.$transaction(async (tx) => {
          const thread = await tx.chatThread.create({
            data: {
              organizationId: user.organizationId,
              createdBy: user.id,
              threadType: ThreadType.direct,
            },
          });

          // Add both members
          await tx.chatThreadMember.createMany({
            data: [
              {
                threadId: thread.id,
                userId: user.id,
                organizationId: user.organizationId,
                role: ThreadMemberRole.owner,
                joinedAt: new Date(),
              },
              {
                threadId: thread.id,
                userId: receiverId,
                organizationId: user.organizationId,
                role: ThreadMemberRole.member,
                joinedAt: new Date(),
              },
            ],
          });

          return thread;
        });

        threadId = newThread.id;
      }
    }

    if (!threadId) {
      return NextResponse.json(
        { error: "No thread context found. Please provide threadId or receiverId." },
        { status: 400 }
      );
    }

    // Verify user is a member of the thread
    const membership = await prisma.chatThreadMember.findFirst({
      where: {
        threadId,
        userId: user.id,
        leftAt: null,
      },
      select: {
        id: true,
        isMuted: true,
        mutedUntil: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this conversation" },
        { status: 403 }
      );
    }

    // Check if user has muted this conversation
    const isMuted = membership.isMuted && (!membership.mutedUntil || new Date(membership.mutedUntil) > new Date());

    // Create the message
    const message = await prisma.$transaction(async (tx) => {
      // Create the message
      const newMessage = await tx.message.create({
        data: {
          threadId,
          senderId: user.id,
          organizationId: user.organizationId,
          content: content || null,
          messageType: messageType as MessageType,
          replyToMessageId: replyToMessageId || null,
          status: MessageStatus.sent,
          metadata: metadata,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
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
        },
      });

      // Create attachments if provided
      if (attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((att: any) => ({
            messageId: newMessage.id,
            organizationId: user.organizationId,
            fileUrl: att.url,
            cdnUrl: att.cdnUrl || null,
            fileName: att.name,
            mimeType: att.type,
            fileSizeBytes: att.size,
            widthPx: att.width || null,
            heightPx: att.height || null,
            durationSecs: att.duration || null,
            thumbnailUrl: att.thumbnailUrl || null,
          })),
        });
      }

      // Update thread's last message and count
      await tx.chatThread.update({
        where: { id: threadId },
        data: {
          lastMessageId: newMessage.id,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Update unread counts for all other members
      const otherMembers = await tx.chatThreadMember.findMany({
        where: {
          threadId,
          userId: { not: user.id },
          leftAt: null,
        },
        select: {
          userId: true,
          isMuted: true,
          mutedUntil: true,
        },
      });

      for (const member of otherMembers) {
        // Skip if member has muted the conversation
        const isMemberMuted = member.isMuted && (!member.mutedUntil || new Date(member.mutedUntil) > new Date());
        
        if (!isMemberMuted) {
          await tx.chatThreadMember.update({
            where: {
              threadId_userId: {
                threadId,
                userId: member.userId,
              },
            },
            data: {
              unreadCount: { increment: 1 },
            },
          });

          // Create notification for the recipient
          await tx.notification.create({
            data: {
              userId: member.userId,
              organizationId: user.organizationId,
              type: "new_message",
              category: "social",
              title: "New Message",
              body: `${user.fullName} sent you a message${content ? `: ${content.substring(0, 100)}` : ''}`,
              payload: {
                threadId,
                messageId: newMessage.id,
                senderId: user.id,
                senderName: user.fullName,
                hasAttachment: attachments.length > 0,
              },
              actionUrl: `/dashboard/messages/${threadId}`,
            },
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "message.sent",
          entityType: "message",
          entityId: newMessage.id,
          afterState: {
            threadId,
            messageType,
            hasAttachment: attachments.length > 0,
          },
          severity: "info",
        },
      });

      return newMessage;
    });

    // Format response
    const responseMessage = {
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      status: message.status,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.fullName,
        avatar: message.sender.avatarUrl,
      },
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content?.substring(0, 100),
        senderName: message.replyTo.sender.fullName,
      } : null,
      attachments: attachments,
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
      threadId,
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate message detected" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to send message",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/* ✅ BULK SEND MESSAGES (for announcements) */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        userType: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = user.userRoles.some(ur => 
      ur.role.slug === "admin" || ur.role.slug === "super-admin"
    );
    const isSuperAdmin = user.userType === "super_admin";

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Only admins can send bulk messages" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { recipientIds, content, subject, messageType = "text" } = body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify all recipients exist and are in the same organization
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        organizationId: user.organizationId,
        status: "active",
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (recipients.length !== recipientIds.length) {
      return NextResponse.json(
        { error: "One or more recipients not found or not in your organization" },
        { status: 404 }
      );
    }

    // Create messages for each recipient (or create a group thread)
    const results = await prisma.$transaction(async (tx) => {
      const messages = [];
      
      for (const recipient of recipients) {
        // Find or create direct thread
        let thread = await tx.chatThread.findFirst({
          where: {
            threadType: ThreadType.direct,
            organizationId: user.organizationId,
            members: {
              every: {
                userId: { in: [user.id, recipient.id] },
              },
            },
          },
        });

        if (!thread) {
          thread = await tx.chatThread.create({
            data: {
              organizationId: user.organizationId,
              createdBy: user.id,
              threadType: ThreadType.direct,
              members: {
                create: [
                  { userId: user.id, organizationId: user.organizationId, role: ThreadMemberRole.owner },
                  { userId: recipient.id, organizationId: user.organizationId, role: ThreadMemberRole.member },
                ],
              },
            },
          });
        }

        // Create the message
        const message = await tx.message.create({
          data: {
            threadId: thread.id,
            senderId: user.id,
            organizationId: user.organizationId,
            content: content,
            messageType: messageType as MessageType,
            status: MessageStatus.sent,
            metadata: { isBulk: true, subject },
          },
        });

        // Update thread
        await tx.chatThread.update({
          where: { id: thread.id },
          data: {
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          },
        });

        // Update unread count for recipient
        await tx.chatThreadMember.update({
          where: {
            threadId_userId: {
              threadId: thread.id,
              userId: recipient.id,
            },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: recipient.id,
            organizationId: user.organizationId,
            type: "bulk_message",
            category: "system",
            title: subject || "Announcement",
            body: content.substring(0, 200),
            payload: {
              threadId: thread.id,
              messageId: message.id,
              senderId: user.id,
            },
            actionUrl: `/dashboard/messages/${thread.id}`,
          },
        });

        messages.push({
          recipientId: recipient.id,
          messageId: message.id,
        });
      }

      return messages;
    });

    return NextResponse.json({
      success: true,
      message: `Message sent to ${results.length} recipient(s)`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk send error:", error);
    return NextResponse.json(
      { error: "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}