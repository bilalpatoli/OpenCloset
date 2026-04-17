export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}
