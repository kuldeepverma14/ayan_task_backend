import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Strict JWT Verification
 */
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const legacyToken = req.cookies?.accessToken;
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;

    // Prioritize Header (Testing/Apps) over Cookies (Browser)
    let token = (headerToken || legacyToken)?.trim();


    if (!token || token === "undefined" || token === "null") {
      console.log("-> AUTH FAILED: No token found");
      return res.status(401).json(ApiResponse(401, null, "Unauthorized access"));
    }

    // CHECK BLACKLIST
    const isRevoked = await prisma.revokedToken.findUnique({ where: { token } });
    if (isRevoked) {
      console.log("-> AUTH FAILED: Token is in Blacklist");
      return res.status(401).json(ApiResponse(401, null, "Session revoked. Please login again."));
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("-> AUTH SUCCESS: Token decoded for user:", decodedToken.id);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      include: {
        role: {
          include: {
            permissions: { include: { page: true } }
          }
        },
        userPermissions: { include: { page: true } }
      }
    });

    if (!user) {
      console.log("-> AUTH FAILED: User not found in DB");
      return res.status(401).json(ApiResponse(401, null, "Invalid Access Token"));
    }

    if (!user.status) {
      console.log("-> AUTH FAILED: User account deactivated");
      return res.status(403).json(ApiResponse(403, null, "Your digital access has been revoked by Super Admin"));
    }

    // Hybrid Permission Merging (User Overrides + Role Defaults)
    const activePermissions = [...user.role.permissions];
    user.userPermissions.forEach(override => {
      const index = activePermissions.findIndex(p => p.pageId === override.pageId);
      if (index !== -1) activePermissions[index] = override;
      else activePermissions.push(override);
    });

    req.user = { ...user, activePermissions };
    next();
  } catch (error) {
    console.log("-> AUTH FAILED: JWT Verification error:", error.message);
    return res.status(401).json(ApiResponse(401, null, "Expired or invalid session"));
  }
};

/**
 * Optional Auth (Does not fail if no token provided)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return next();

    // CHECK BLACKLIST
    const isRevoked = await prisma.revokedToken.findUnique({ where: { token } });
    if (isRevoked) return next();

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      include: {
        role: { include: { permissions: { include: { page: true } } } },
        userPermissions: { include: { page: true } }
      }
    });

    if (user && user.status) {
      const activePermissions = [...user.role.permissions];
      user.userPermissions.forEach(override => {
        const index = activePermissions.findIndex(p => p.pageId === override.pageId);
        if (index !== -1) activePermissions[index] = override;
        else activePermissions.push(override);
      });
      req.user = { ...user, activePermissions };
    }
  } catch (error) {
    // Silently continue for optional auth
  }
  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role?.name !== 'SUPER_ADMIN') {
    return res.status(403).json(ApiResponse(403, null, "Elevated Super Admin authority required"));
  }
  next();
};

export const checkPermission = (pagePath, action) => {
  return (req, res, next) => {
    if (req.user?.role?.name === 'SUPER_ADMIN') return next();
    const permission = req.user?.activePermissions?.find(p => p.page.path === pagePath);
    if (permission && permission[action]) return next();
    return res.status(403).json(ApiResponse(403, null, `Access Denied: Lacking ${action} authority`));
  };
};
