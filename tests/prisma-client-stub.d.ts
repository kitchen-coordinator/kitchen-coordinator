declare module '@prisma/client' {
  // Minimal stub so TestCafe can compile files that import PrismaClient.
  // This does NOT affect runtime – it only provides types for the TS compiler
  // used by TestCafe.
  export class PrismaClient {
    constructor(options?: any);
    [key: string]: any;
  }
}

