import fs from 'fs';
import path from 'path';

interface User {
  username: string;
  password: string;
}

const USERS_FILE = path.join(process.cwd(), 'users.json');

export function getUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      { username: 'user1', password: 'password1' },
      { username: 'user2', password: 'password2' }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function findUser(username: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.username === username);
}

export function logAllUsers() {
  const users = getUsers();
  console.log('All users:', users);
}