import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardStats(req.user);
  return res.status(200).json(ApiResponse(200, data, "Dashboard stats fetched successfully"));
});

export const getActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getActivityHistory(req.user, req.query);
  return res.status(200).json(ApiResponse(200, data, "Dashboard activity history fetched successfully"));
});
