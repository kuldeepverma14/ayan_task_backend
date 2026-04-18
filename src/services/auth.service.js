import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { createLog } from './audit.service.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, roleId } = userData;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(400, 'User with this email already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, roleId },
    include: { role: true },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (email, password, req) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { include: { permissions: { include: { page: true } } } } }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await createLog({ userId: user?.id, action: 'LOGIN_FAILURE', entity: 'User', details: { email }, req });
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  await createLog({ userId: user.id, action: 'LOGIN', entity: 'User', details: { email: user.email }, req });

  const { password: _, refreshToken: __, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
};

export const refreshAccessToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new ApiError(403, 'Refresh token required'); // 403 for refresh flow

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user || user.refreshToken !== oldRefreshToken) {
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      }
      throw new ApiError(403, 'Refresh token expired or reused');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new ApiError(403, error.message || 'Refresh token invalid');
  }
};

export const clearRefreshToken = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });
};

export const revokeToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;

    const expiresAt = new Date(decoded.exp * 1000);

    await prisma.revokedToken.upsert({
      where: { token },
      update: {},
      create: {
        token,
        expiresAt
      }
    });
  } catch (error) {
    console.error("Token revocation failure:", error);
  }
};

export const isTokenRevoked = async (token) => {
  const revoked = await prisma.revokedToken.findUnique({
    where: { token }
  });
  return !!revoked;
};
