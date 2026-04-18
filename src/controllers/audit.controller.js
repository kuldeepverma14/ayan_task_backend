import * as auditService from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getLogs = asyncHandler(async (req, res) => {
  const data = await auditService.getAllLogs(req.query);
  return res.status(200).json(ApiResponse(200, data, "Audit logs fetched successfully"));
});
