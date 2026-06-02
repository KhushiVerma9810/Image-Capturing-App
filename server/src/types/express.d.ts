declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        username: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

export {};
