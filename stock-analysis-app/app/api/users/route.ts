import { NextResponse } from 'next/server'
import { addUser, updateUser, deleteUser, getUsers } from '@/lib/userManagement'

export async function GET() {
  const users = getUsers().map(user => user.username);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  try {
    addUser(username, password);
    return NextResponse.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const { username, newPassword } = await request.json();
  try {
    updateUser(username, newPassword);
    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { username } = await request.json();
  try {
    deleteUser(username);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}