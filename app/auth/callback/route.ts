// 📄 app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserStatus, UserType } from '@/lib/generated/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const redirectUrl = requestUrl.searchParams.get('redirect_url') || '/dashboard'
  const inviteToken = requestUrl.searchParams.get('invite_token')
  
  // ✅ If the user signed up via /sign-up?redirect=/organization/setup, treat them as super_admin
  const isOrgSetupIntent = redirectUrl.includes('/organization/setup')
  
  try {
    // Get the authenticated user from Clerk
    const { userId: clerkId, sessionId } = await auth()
    
    if (!clerkId) {
      // No authenticated user, redirect to login
      return NextResponse.redirect(
        new URL(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`, request.url)
      )
    }

    // Get Clerk user details
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkId)
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress
    const firstName = clerkUser.firstName || ''
    const lastName = clerkUser.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim() || primaryEmail?.split('@')[0] || 'User'

    if (!primaryEmail) {
      console.error('No email found for Clerk user:', clerkId)
      return NextResponse.redirect(
        new URL('/sign-in?error=no_email', request.url)
      )
    }

    // Check if user exists in our database
    let user: any = await prisma.user.findFirst({
      where: {
        metadata: {
          path: ['clerkId'],
          equals: clerkId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        userType: true,
        status: true,
        fullName: true,
        metadata: true,
      },
    })

    // If user doesn't exist, create them
    if (!user) {
      const existingOrg = await prisma.organization.findFirst({
        where: { deletedAt: null, isActive: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });

      const noOrganizationsExist = !existingOrg;
      // super_admin if: signup came from org-setup intent OR no orgs exist at all
      const defaultUserType =
        isOrgSetupIntent || noOrganizationsExist
          ? UserType.super_admin
          : UserType.alumni;
      let initialOrgId: string | null = null;

      // Check if there's an invitation for this email
      let invitation = null
      if (inviteToken) {
        invitation = await prisma.orgInvitation.findFirst({
          where: {
            token: inviteToken,
            email: primaryEmail.toLowerCase(),
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
          include: {
            organization: true,
            role: true,
          },
        })
      }

      // If no invite token provided, check for pending invites by email
      if (!invitation) {
        invitation = await prisma.orgInvitation.findFirst({
          where: {
            email: primaryEmail.toLowerCase(),
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
          include: {
            organization: true,
            role: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      }

      // Create new user
      user = await prisma.$transaction(async (tx) => {
        const organizationId = invitation?.organizationId;
        const metadata = {
          clerkId,
          createdAt: new Date().toISOString(),
          ...(lastName ? { lastName } : {}),
          ...(invitation && { invitedBy: invitation.invitedBy }),
        };

        const newUser = organizationId
          ? await tx.user.create({
              data: {
                email: primaryEmail.toLowerCase(),
                emailNormalized: primaryEmail.toLowerCase(),
                firstName,
                fullName,
                userType: invitation?.userType || defaultUserType,
                status: invitation ? UserStatus.active : UserStatus.pending,
                emailVerified: true,
                metadata,
                organizationId,
              } as any,
            })
          : await tx.user.create({
              data: {
                email: primaryEmail.toLowerCase(),
                emailNormalized: primaryEmail.toLowerCase(),
                firstName,
                fullName,
                userType: invitation?.userType || defaultUserType,
                status: invitation ? UserStatus.active : UserStatus.pending,
                emailVerified: true,
                metadata,
              } as any,
            });

        // If there's an invitation, process it
        if (invitation) {
          // Assign role from invitation
          if (invitation.roleId) {
            await tx.userRole.create({
              data: {
                userId: newUser.id,
                roleId: invitation.roleId,
                organizationId: invitation.organizationId,
                grantedBy: invitation.invitedBy,
                grantedReason: 'Accepted invitation',
              },
            })
          }

          // Create profile based on user type
          if (invitation.userType === UserType.alumni) {
            await tx.alumniProfile.create({
              data: {
                userId: newUser.id,
                organizationId: invitation.organizationId,
              },
            })
          } else if (invitation.userType === UserType.student) {
            await tx.studentProfile.create({
              data: {
                userId: newUser.id,
                organizationId: invitation.organizationId,
              },
            })
          }

          // Mark invitation as accepted
          await tx.orgInvitation.update({
            where: { id: invitation.id },
            data: {
              status: 'accepted',
              acceptedAt: new Date(),
            },
          })

          // Create welcome notification
          await tx.notification.create({
            data: {
              userId: newUser.id,
              organizationId: invitation.organizationId,
              type: 'welcome',
              category: 'system',
              title: `Welcome to ${invitation.organization.name}!`,
              body: `You've successfully joined ${invitation.organization.name}. Complete your profile to get started.`,
              payload: {
                organizationId: invitation.organizationId,
                invitationId: invitation.id,
              },
              actionUrl: '/dashboard/profile/edit',
            },
          })
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            organizationId: invitation?.organizationId || null,
            actorId: newUser.id,
            action: 'user.created_via_auth',
            entityType: 'user',
            entityId: newUser.id,
            entityLabel: newUser.email,
            afterState: {
              source: 'clerk_oauth',
              hasInvitation: !!invitation,
            },
            severity: 'info',
          },
        })

        return newUser
      })

      // ✅ Write userType into Clerk publicMetadata for instant client-side role routing
      try {
        await clerk.users.updateUser(clerkId, {
          publicMetadata: {
            ...(clerkUser.publicMetadata || {}),
            userType: user.userType,
            hasOrganization: !!user.organizationId,
          },
        })
      } catch (e) {
        console.error('Failed to sync publicMetadata:', e)
      }
    } else {
      // User exists, update last login info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          status: user.status === UserStatus.pending ? UserStatus.active : user.status,
        },
      })

      // ✅ Keep Clerk publicMetadata in sync on every login
      try {
        await clerk.users.updateUser(clerkId, {
          publicMetadata: {
            ...(clerkUser.publicMetadata || {}),
            userType: user.userType,
            hasOrganization: !!user.organizationId,
          },
        })
      } catch (e) {
        console.error('Failed to update publicMetadata:', e)
      }

      // Update user's name if changed in Clerk
      if (user.fullName !== fullName && fullName !== 'User') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            fullName,
            metadata: {
              ...((user.metadata as any) || {}),
              ...(lastName ? { lastName } : {}),
            },
          },
        })
      }

      // Process invitation if user was invited but not yet associated
      if (!user.organizationId && inviteToken) {
        const invitation = await prisma.orgInvitation.findFirst({
          where: {
            token: inviteToken,
            email: primaryEmail.toLowerCase(),
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
          include: {
            organization: true,
            role: true,
          },
        })

        if (invitation) {
          await prisma.$transaction(async (tx) => {
            // Update user's organization
            await tx.user.update({
              where: { id: user.id },
              data: { 
                organizationId: invitation.organizationId,
                userType: invitation.userType,
              },
            })

            // Assign role
            if (invitation.roleId) {
              await tx.userRole.create({
                data: {
                  userId: user.id,
                  roleId: invitation.roleId,
                  organizationId: invitation.organizationId,
                  grantedBy: invitation.invitedBy,
                  grantedReason: 'Accepted invitation',
                },
              })
            }

            // Create profile if needed
            const hasProfile = await tx.alumniProfile.findUnique({
              where: { userId: user.id },
            }) || await tx.studentProfile.findUnique({
              where: { userId: user.id },
            })

            if (!hasProfile) {
              if (invitation.userType === UserType.alumni) {
                await tx.alumniProfile.create({
                  data: {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                  },
                })
              } else if (invitation.userType === UserType.student) {
                await tx.studentProfile.create({
                  data: {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                  },
                })
              }
            }

            // Mark invitation as accepted
            await tx.orgInvitation.update({
              where: { id: invitation.id },
              data: {
                status: 'accepted',
                acceptedAt: new Date(),
              },
            })

            // Create notification
            await tx.notification.create({
              data: {
                userId: user.id,
                organizationId: invitation.organizationId,
                type: 'welcome',
                category: 'system',
                title: `Welcome to ${invitation.organization.name}!`,
                body: `You've successfully joined ${invitation.organization.name}.`,
                payload: { organizationId: invitation.organizationId },
                actionUrl: '/dashboard',
              },
            })
          })
        }
      }
    }

    // Determine where to redirect
    let finalRedirectUrl = redirectUrl

    // If user has no organization, route to the appropriate setup flow.
    if (!user.organizationId) {
      finalRedirectUrl = user.userType === UserType.super_admin ? '/organization/setup' : '/onboarding';
    }
    
    // If user has incomplete profile, allow middleware to enforce profile completion
    else if (user.userType === UserType.alumni) {
      const alumniProfile = await prisma.alumniProfile.findUnique({
        where: { userId: user.id },
      })
      if (alumniProfile && (!alumniProfile.headline || !alumniProfile.bio)) {
        finalRedirectUrl = redirectUrl
      }
    } else if (user.userType === UserType.student) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      })
      if (studentProfile && (!studentProfile.headline || !studentProfile.bio)) {
        finalRedirectUrl = redirectUrl
      }
    }

    // Create session tracking
    await prisma.userSession.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        tokenHash: sessionId || 'clerk_session',
        deviceType: 'web',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastUsedAt: new Date(),
      },
    }).catch(() => {
      // Ignore session creation errors
      console.error('Failed to create session tracking')
    })

    // Redirect to the appropriate page
    return NextResponse.redirect(new URL(finalRedirectUrl, request.url))
  } catch (error: any) {
    console.error('Auth callback error:', error)
    
    // Redirect to login with error
    return NextResponse.redirect(
      new URL(`/sign-in?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}