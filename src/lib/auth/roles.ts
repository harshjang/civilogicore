export const canEdit = (role: string) => {
  return role === "admin" || role === "engineer";
};

export const canDelete = (role: string) => {
  return role === "admin";
};

export const canView = (role: string) => {
  return true;
};