// src/utils/roleHelpers.ts

export type UserRole = 'super-admin' | 'tenant-admin' | 'user';

export interface User {
  username: string;
  email: string;
  sub: string;
  groups?: string[];
}

// Helper to determine user role from context
export const getUserRole = (user: User | null): UserRole => {
  if (!user) return 'user';
  
  // Check if user is in super-admin group
  if (user.groups?.includes('super-admin') || user.groups?.includes('admin')) {
    return 'super-admin';
  }
  
  // Check if user is in tenant-admin group
  if (user.groups?.includes('tenant-admin') || user.groups?.includes('tenant_admin')) {
    return 'tenant-admin';
  }
  
  // Default to regular user
  return 'user';
};

// Helper to check if user has required role
export const hasRole = (user: User | null, requiredRole: UserRole): boolean => {
  const userRole = getUserRole(user);
  
  const roleHierarchy: Record<UserRole, number> = {
    'user': 1,
    'tenant-admin': 2,
    'super-admin': 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Helper to get accessible routes for user
export const getAccessibleRoutes = (user: User | null): string[] => {
  const role = getUserRole(user);
  
  const routes: string[] = ['/'];
  
  if (role === 'super-admin') {
    routes.push('/admin/scanner-tools');
    routes.push('/tenant-tools');
    routes.push('/my-scanners');
  } else if (role === 'tenant-admin') {
    routes.push('/tenant-tools');
    routes.push('/my-scanners');
  } else {
    routes.push('/my-scanners');
  }
  
  return routes;
};

