import { NextResponse } from 'next/server'
import { findUser, logAllUsers } from '@/lib/users'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  console.log('Login attempt:', { username, password });
  logAllUsers(); // This will log all users to the console

  const user = findUser(username)

  if (!user) {
    console.log('User not found');
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 })
  }

  if (user.password !== password) {
    console.log('Incorrect password');
    return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 401 })
  }

  console.log('Login successful');
  const response = NextResponse.json({ success: true })
  response.cookies.set('auth', username, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  })
  return response
}