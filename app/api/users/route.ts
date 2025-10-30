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
    degree: 'Computer Science'
  },
  {
    id: '2',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@example.com',
    role: 'alumni',
    status: 'active',
    batch: '2012',
    degree: 'Business Administration'
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  // Filter users based on query parameters
  let filteredUsers = users;

  if (search) {
    filteredUsers = filteredUsers.filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status && status !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.status === status);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return NextResponse.json({
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'alumni',
      status: body.status || 'active',
      batch: body.batch || '',
      degree: body.degree || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}