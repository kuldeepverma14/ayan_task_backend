import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getUsers = asyncHandler(async (req, res) => {
  const data = await userService.getAllUsers(req.query);
  return res.status(200).json(ApiResponse(200, data, "Users fetched successfully"));
});

export const addUser = asyncHandler(async (req, res) => {
  const user = await userService.createUserByAdmin(req.body, req);
  return res.status(201).json(ApiResponse(201, user, "User account created successfully"));
});

export const editUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUserByAdmin(req.params.id, req.body, req);
  return res.status(200).json(ApiResponse(200, user, "User profile updated successfully"));
});

export const removeUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req);
  return res.status(200).json(ApiResponse(200, {}, "User deleted successfully"));
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id, req);
  return res.status(200).json(ApiResponse(200, user, `Account ${user.status ? 'enabled' : 'disabled'} successfully`));
});

export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getAvailableRoles();
  return res.status(200).json(ApiResponse(200, roles, "Roles fetched successfully"));
});
