import type { NextFunction, Request, Response } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const expectedUser = process.env.ADMIN_USER || "";
  const expectedPass = process.env.ADMIN_PASSWORD || "";

  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sepIndex = decoded.indexOf(":");
    const user = decoded.slice(0, sepIndex);
    const pass = decoded.slice(sepIndex + 1);
    if (user === expectedUser && pass === expectedPass) {
      next();
      return;
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="GATES Admin"');
  res.status(401).json({ error: "Authentication required." });
}
