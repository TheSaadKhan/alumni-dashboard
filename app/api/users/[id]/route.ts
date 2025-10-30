import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with actual database calls
let users = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    role: 'alumni',
    status: 'active',
    batch: '2015',
    degree: 'Computer Science',
    location: 'San Francisco, CA',
    company: 'TechCorp',
    position: 'Engineering Manager',
  },
  {
    id: '2',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@example.com',
    role: 'alumni',
    status: 'active',
    batch: '2012',
    degree: 'Business Administration',
    location: 'New York, NY',
    company: 'StartupXYZ',
    position: 'Product Director',
  },
];

// ✅ Works with Next.js 15+ (params is sometimes typed as a Promise)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // note the await

  const user = users.find((u) => u.id === id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const updatedUser = {
      ...users[userIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    users.splice(userIndex, 1);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
