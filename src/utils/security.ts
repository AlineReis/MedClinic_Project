import bcrypt from "bcrypt";

export class SecurityUtils {
  static async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }
}
