package com.bizsmart.security;

/**
 * SpEL expressions for @PreAuthorize, kept in one place so role rules stay consistent.
 *
 * Roles in the system:
 *  - BUSINESS_OWNER / ADMIN / MANAGER / PLATFORM_ADMIN  -> store management ("management")
 *  - EMPLOYEE / STAFF                                   -> counter staff (POS, stock updates)
 *  - SUPPLIER                                           -> read-only supplier portal
 */
public final class Roles {

    private Roles() {
    }

    public static final String MANAGEMENT =
            "hasAnyRole('BUSINESS_OWNER','ADMIN','MANAGER','PLATFORM_ADMIN')";

    public static final String OWNER =
            "hasAnyRole('BUSINESS_OWNER','ADMIN','PLATFORM_ADMIN')";

    public static final String STORE_STAFF =
            "hasAnyRole('BUSINESS_OWNER','ADMIN','MANAGER','PLATFORM_ADMIN','EMPLOYEE','STAFF')";
}
