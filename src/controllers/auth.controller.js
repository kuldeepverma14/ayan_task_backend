import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  return res
    .status(201)
    .json(ApiResponse(201, user, 'User registered successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password, req);

  return res
    .status(200)
    .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json(ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful'));
});

export const getMe = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(ApiResponse(200, { user: req.user, isAuthenticated: true }, 'User profile fetched'));
});

export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  const { accessToken, refreshToken } = await authService.refreshAccessToken(oldRefreshToken);

  return res
    .status(200)
    .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json(ApiResponse(200, { accessToken, refreshToken }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
  if (token) {
    await authService.revokeToken(token);
  }

  if (req.user?.id) {
    await authService.clearRefreshToken(req.user.id);
  }
  
  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(ApiResponse(200, {}, 'Logout successful'));
});
