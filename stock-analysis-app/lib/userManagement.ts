import fs from 'fs';
import path from 'path';

interface User {
  username: string;
  password: string;
}

const USERS_FILE = path.join(process.cwd(), 'users.json');

export function getUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveUsers(users: User[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function addUser(username: string, password: string) {
  const users = getUsers();
  if (users.some(user => user.username === username)) {
    throw new Error('Username already exists');
  }
  users.push({ username, password });
  saveUsers(users);
}

export function updateUser(username: string, newPassword: string) {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.username === username);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  users[userIndex].password = newPassword;
  saveUsers(users);
}

export function deleteUser(username: string) {
  const users = getUsers();
  const updatedUsers = users.filter(user => user.username !== username);
  if (users.length === updatedUsers.length) {
    throw new Error('User not found');
  }
  saveUsers(updatedUsers);
}

export function findUser(username: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.username === username);
}