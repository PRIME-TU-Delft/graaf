
export type UserRole = 'USER' | 'ADMIN'
export type Permission = 'EDITOR' | 'ADMIN'

export function validUserRole(object: any): object is UserRole {
    return ['USER', 'ADMIN'].includes(object)
}

export function validPermission(object: any): object is Permission {
    return ['EDITOR', 'ADMIN'].includes(object)
}