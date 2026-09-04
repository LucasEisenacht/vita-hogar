export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length >= 8 && digits.length <= 15;
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}
