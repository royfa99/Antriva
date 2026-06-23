import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWIBDate() {
  const d = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  return new Date(d);
}

export function getWIBDateString() {
  const dateObj = getWIBDate();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWIBDay() {
  return getWIBDate().getDay();
}

export function getWIBHour() {
  return getWIBDate().getHours();
}
