export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Accepts international format (+919876543210) and local format (9876543210)
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$|^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 80;
}

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

// Policy: 8+ characters — aligned with isValidPassword usage across the app
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
