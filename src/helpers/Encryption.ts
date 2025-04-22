import crypto from "crypto";
import { SECURITY_KEY, SECURITY_VECTOR, ALGORITHM } from "../constants";

const key = Buffer.from(SECURITY_KEY || "", "hex");
const iv = Buffer.from(SECURITY_VECTOR || "", "hex");
// 🛠 **Hàm mã hóa: Trả về string có thể lưu vào DB hoặc gửi API**
export function encrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
  
    // Chuyển thành JSON và mã hóa Base64 để gửi API hoặc lưu DB
    const encryptedObject = { encryptedData: encrypted, iv: iv.toString("hex") };
    return Buffer.from(JSON.stringify(encryptedObject)).toString("base64");
  }
  
  // 🛠 **Hàm giải mã: Nhận string từ API và giải mã**
  export function decrypt(encryptedString: string | null | undefined): string | null {
    if (!encryptedString) return null;
    try {
      // Giải mã Base64 → JSON
      const decoded = JSON.parse(Buffer.from(encryptedString, "base64").toString("utf8"));
  
      // Giải mã dữ liệu
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(decoded.iv, "hex")
      );
      let decrypted = decipher.update(decoded.encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");
  
      return decrypted;
    } catch (error) {
      console.error("Lỗi giải mã:", error);
      return "";
    }
  }
  
//   // 🎯 **Thử nghiệm mã hóa & giải mã**
//   const originalMessage = "Đây là tin nhắn bí mật!";
//   const encryptedString = encrypt(originalMessage);
//   console.log("🔒 Mã hóa:", encryptedString); // Chuỗi lưu vào DB hoặc gửi API
  
//   const decryptedMessage = decrypt(encryptedString);
//   console.log("🔓 Giải mã:", decryptedMessage); // "Đây là tin nhắn bí mật!"
