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
  
export function decrypt(encryptedString: string | null | undefined): string | null {
  if (!encryptedString) return null;

  try {
    const decodedBase64 = Buffer.from(encryptedString, "base64").toString("utf8");

    // Nếu không phải chuỗi JSON hợp lệ thì bỏ qua
    if (!decodedBase64.startsWith("{") || !decodedBase64.includes("encryptedData") || !decodedBase64.includes("iv")) {
      console.warn("⚠️ Bỏ qua chuỗi không hợp lệ:", encryptedString);
      return null;
    }

    const decoded = JSON.parse(decodedBase64);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(decoded.iv, "hex")
    );
    let decrypted = decipher.update(decoded.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("❌ Lỗi giải mã:", error.message || error);
    return null;
  }
}
  
//   // 🎯 **Thử nghiệm mã hóa & giải mã**
//   const originalMessage = "Đây là tin nhắn bí mật!";
//   const encryptedString = encrypt(originalMessage);
//   console.log("🔒 Mã hóa:", encryptedString); // Chuỗi lưu vào DB hoặc gửi API
  
//   const decryptedMessage = decrypt(encryptedString);
//   console.log("🔓 Giải mã:", decryptedMessage); // "Đây là tin nhắn bí mật!"
