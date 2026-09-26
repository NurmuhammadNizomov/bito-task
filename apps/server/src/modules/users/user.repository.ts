import { User } from './user.model';

export async function findByEmail(email: string) {
  return User.findOne({ email }).lean();
}

export async function findById(id: string) {
  return User.findById(id).lean();
}

export async function updateLastLogin(id: string) {
  return User.findByIdAndUpdate(id, { lastLoginAt: new Date() }).lean();
}
