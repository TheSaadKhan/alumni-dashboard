// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ThreadType, ThreadMemberRole, MessageType } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ✅ GET ALL CONVERSATIONS (THREADS) */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // all, direct, group
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

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
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build where clause for thread types
    const threadTypeFilter: ThreadType[] = [];
    if (type === "direct") threadTypeFilter.push(ThreadType.direct);
    if (type === "group") threadTypeFilter.push(ThreadType.group);
    if (type === "all") threadTypeFilter.push(ThreadType.direct, ThreadType.group);

    // Find all threads where the user is a member
    const threads = await prisma.chatThread.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            leftAt: null,
          },
        },
        threadType: { in: threadTypeFilter },
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              members: {
                some: {
                  user: {
                    fullName: { contains: search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }),
      },
      include: {
        members: {
          where: {
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
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            attachments: {
              take: 1,
              select: {
                id: true,
                mimeType: true,
                thumbnailUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    // Get unread counts for each thread
    const unreadCounts = await prisma.chatThreadMember.findMany({
      where: {
        userId: user.id,
        threadId: { in: threads.map(t => t.id) },
      },
      select: {
        threadId: true,
        unreadCount: true,
        lastReadAt: true,
      },
    });

    const unreadMap = new Map(
      unreadCounts.map(uc => [uc.threadId, { count: uc.unreadCount, lastReadAt: uc.lastReadAt }])
    );

    // Format conversations for UI
    const conversations = threads.map(thread => {
      const currentUserMember = thread.members.find(m => m.userId === user.id);
      const otherMembers = thread.members.filter(m => m.userId !== user.id);
      const lastMessage = thread.messages[0];
      const unreadData = unreadMap.get(thread.id);
      
      // Determine if the last message is from the current user
      const isLastMessageFromUser = lastMessage?.senderId === user.id;
      
      // Format last message preview
      let lastMessagePreview = "";
      if (lastMessage) {
        if (lastMessage.messageType === MessageType.text) {
          lastMessagePreview = lastMessage.content || "";
        } else if (lastMessage.messageType === MessageType.image) {
          lastMessagePreview = "📷 Image";
        } else if (lastMessage.messageType === MessageType.file) {
          lastMessagePreview = "📎 File";
        } else if (lastMessage.messageType === MessageType.video) {
          lastMessagePreview = "🎥 Video";
        } else if (lastMessage.messageType === MessageType.audio) {
          lastMessagePreview = "🎵 Audio";
        } else {
          lastMessagePreview = `[${lastMessage.messageType}]`;
        }
        
        if (lastMessagePreview.length > 50) {
          lastMessagePreview = lastMessagePreview.substring(0, 50) + "...";
        }
      }

      return {
        id: thread.id,
        type: thread.threadType,
        name: thread.title || (otherMembers.length === 1 
          ? otherMembers[0].user.fullName 
          : otherMembers.map(m => m.user.firstName || m.user.fullName.split(' ')[0]).join(", ")),
        isGroup: thread.threadType === "group",
        avatar: thread.threadType === "group" 
          ? null 
          : (otherMembers[0]?.user.avatarUrl || null),
        participants: otherMembers.map(m => ({
          id: m.user.id,
          name: m.user.fullName,
          avatar: m.user.avatarUrl,
          userType: m.user.userType,
          isOnline: m.user.lastSeenAt 
            ? new Date(m.user.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000
            : false,
          role: m.role,
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessagePreview,
          fullContent: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.fullName,
          isFromUser: isLastMessageFromUser,
          hasAttachment: lastMessage.attachments.length > 0,
          attachmentType: lastMessage.attachments[0]?.mimeType?.split('/')[0],
        } : null,
        unreadCount: unreadData?.count || 0,
        lastReadAt: unreadData?.lastReadAt || null,
        messageCount: thread._count.messages,
        updatedAt: thread.updatedAt,
        createdAt: thread.createdAt,
        isMuted: currentUserMember?.isMuted || false,
        mutedUntil: currentUserMember?.mutedUntil,
        userRole: currentUserMember?.role,
      };
    });

    // Get statistics
    const stats = {
      total: conversations.length,
      unread: conversations.filter(c => c.unreadCount > 0).length,
      direct: conversations.filter(c => !c.isGroup).length,
      groups: conversations.filter(c => c.isGroup).length,
    };

    return NextResponse.json({
      success: true,
      conversations,
      stats,
    });
  } catch (error: any) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/* ✅ CREATE NEW CONVERSATION (DIRECT OR GROUP) */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      participantIds,
      threadType = "direct",
      title,
      initialMessage,
    } = body;

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

    // Validate participants
    let allParticipantIds = [user.id];
    
    if (threadType === "direct") {
      // For direct messages, exactly one other participant
      if (!participantIds || participantIds.length !== 1) {
        return NextResponse.json(
          { error: "Direct message requires exactly one recipient" },
          { status: 400 }
        );
      }
      allParticipantIds.push(participantIds[0]);
    } else if (threadType === "group") {
      // For groups, at least one other participant
      if (!participantIds || participantIds.length < 1) {
        return NextResponse.json(
          { error: "Group requires at least one participant" },
          { status: 400 }
        );
      }
      allParticipantIds = [...allParticipantIds, ...participantIds];
      
      if (!title) {
        return NextResponse.json(
          { error: "Group title is required" },
          { status: 400 }
        );
      }
    }

    // Remove duplicates
    allParticipantIds = [...new Set(allParticipantIds)];

    // Verify all participants exist and are in the same organization
    const participants = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        organizationId: user.organizationId,
        status: "active",
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (participants.length !== allParticipantIds.length) {
      return NextResponse.json(
        { error: "One or more participants not found or not in your organization" },
        { status: 404 }
      );
    }

    // For direct messages, check if a conversation already exists
    if (threadType === "direct") {
      const existingThread = await prisma.chatThread.findFirst({
        where: {
          threadType: ThreadType.direct,
          members: {
            every: {
              userId: { in: allParticipantIds },
            },
          },
          AND: [
            { members: { some: { userId: allParticipantIds[0] } } },
            { members: { some: { userId: allParticipantIds[1] } } },
          ],
        },
        select: { id: true },
      });

      if (existingThread) {
        return NextResponse.json({
          success: true,
          conversation: { id: existingThread.id },
          existing: true,
          message: "Existing conversation found",
        });
      }
    }

    // Create new thread
    const newThread = await prisma.$transaction(async (tx) => {
      const thread = await tx.chatThread.create({
        data: {
          organizationId: user.organizationId,
          createdBy: user.id,
          threadType: threadType === "direct" ? ThreadType.direct : ThreadType.group,
          title: title || null,
        },
      });

      // Add all members to the thread
      for (const participantId of allParticipantIds) {
        await tx.chatThreadMember.create({
          data: {
            threadId: thread.id,
            userId: participantId,
            organizationId: user.organizationId,
            role: participantId === user.id ? ThreadMemberRole.owner : ThreadMemberRole.member,
            joinedAt: new Date(),
          },
        });
      }

      // Create initial message if provided
      let initialMessageRecord = null;
      if (initialMessage) {
        initialMessageRecord = await tx.message.create({
          data: {
            threadId: thread.id,
            senderId: user.id,
            organizationId: user.organizationId,
            content: initialMessage,
            messageType: MessageType.text,
            status: "sent",
          },
        });

        // Update thread's last message
        await tx.chatThread.update({
          where: { id: thread.id },
          data: {
            lastMessageId: initialMessageRecord.id,
            lastMessageAt: new Date(),
            messageCount: 1,
          },
        });

        // Create notifications for other members
        for (const participantId of allParticipantIds.filter(id => id !== user.id)) {
          await tx.notification.create({
            data: {
              userId: participantId,
              organizationId: user.organizationId,
              type: "new_conversation",
              category: "social",
              title: threadType === "direct" ? "New Message" : `Added to group: ${title}`,
              body: threadType === "direct" 
                ? `${user.fullName} sent you a message`
                : `${user.fullName} added you to "${title}"`,
              payload: {
                threadId: thread.id,
                messageId: initialMessageRecord.id,
                senderId: user.id,
              },
              actionUrl: `/dashboard/messages/${thread.id}`,
            },
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "conversation.created",
          entityType: "chat_thread",
          entityId: thread.id,
          afterState: {
            type: threadType,
            participantCount: allParticipantIds.length,
          },
          severity: "info",
        },
      });

      return { thread, initialMessageRecord };
    });

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: newThread.thread.id,
          type: threadType,
          title: title || null,
          createdAt: newThread.thread.createdAt,
        },
        initialMessage: newThread.initialMessageRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE CONVERSATION SETTINGS (Mute, Leave, etc.) */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, action, mutedUntil, isMuted } = body;

    if (!conversationId || !action) {
      return NextResponse.json(
        { error: "Conversation ID and action are required" },
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

    // Verify user is a member of the conversation
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
            threadType: true,
            createdBy: true,
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

    let result;

    switch (action) {
      case "mute":
        result = await prisma.chatThreadMember.update({
          where: {
            threadId_userId: {
              threadId: conversationId,
              userId: user.id,
            },
          },
          data: {
            isMuted: isMuted !== undefined ? isMuted : true,
            mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
          },
        });
        break;

      case "leave":
        if (membership.thread.threadType === "direct") {
          return NextResponse.json(
            { error: "Cannot leave a direct message conversation" },
            { status: 400 }
          );
        }

        result = await prisma.$transaction(async (tx) => {
          const updated = await tx.chatThreadMember.update({
            where: {
              threadId_userId: {
                threadId: conversationId,
                userId: user.id,
              },
            },
            data: {
              leftAt: new Date(),
            },
          });

          // Check if there are any members left
          const remainingMembers = await tx.chatThreadMember.count({
            where: {
              threadId: conversationId,
              leftAt: null,
            },
          });

          // If no members left, archive the thread
          if (remainingMembers === 0) {
            await tx.chatThread.update({
              where: { id: conversationId },
              data: { isArchived: true, archivedAt: new Date() },
            });
          }

          // Create notification for other members
          const otherMembers = await tx.chatThreadMember.findMany({
            where: {
              threadId: conversationId,
              userId: { not: user.id },
              leftAt: null,
            },
            select: { userId: true },
          });

          for (const member of otherMembers) {
            await tx.notification.create({
              data: {
                userId: member.userId,
                organizationId: user.organizationId,
                type: "member_left",
                category: "social",
                title: "Member Left",
                body: `${user.fullName} left the conversation`,
                payload: {
                  threadId: conversationId,
                  userId: user.id,
                },
                actionUrl: `/dashboard/messages/${conversationId}`,
              },
            });
          }

          return updated;
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'mute' or 'leave'" },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        action: `conversation.${action}`,
        entityType: "chat_thread",
        entityId: conversationId,
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Conversation ${action}d successfully`,
      result,
    });
  } catch (error: any) {
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}