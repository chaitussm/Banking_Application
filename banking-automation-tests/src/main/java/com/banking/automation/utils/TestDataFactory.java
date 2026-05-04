package com.banking.automation.utils;

import java.util.UUID;

/**
 * Factory for generating test data that avoids collisions between test runs.
 */
public final class TestDataFactory {

    private TestDataFactory() { }

    /** Returns a unique email address for use during registration tests. */
    public static String uniqueEmail() {
        return "test+" + UUID.randomUUID().toString().substring(0, 8) + "@novabank.com";
    }

    /** Returns a unique full name. */
    public static String uniqueFullName() {
        return "Test User " + UUID.randomUUID().toString().substring(0, 6);
    }

    /** Returns a valid default test password. */
    public static String defaultPassword() {
        return "Password@123";
    }

    /** Returns a deposit amount as a string. */
    public static String depositAmount() {
        return "100.00";
    }

    /** Returns a withdrawal amount as a string. */
    public static String withdrawalAmount() {
        return "50.00";
    }

    /** Returns a transfer amount as a string. */
    public static String transferAmount() {
        return "25.00";
    }
}
