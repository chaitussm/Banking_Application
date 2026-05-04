package com.banking.automation.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Centralized test configuration that resolves values from (in priority order):
 * 1. System properties  (-Dkey=value on the Maven command line)
 * 2. Environment variables
 * 3. src/test/resources/test.properties
 */
public final class TestConfig {

    private static final Properties PROPS = new Properties();

    static {
        try (InputStream is = TestConfig.class.getClassLoader()
                .getResourceAsStream("test.properties")) {
            if (is != null) {
                PROPS.load(is);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load test.properties", e);
        }
    }

    private TestConfig() { }

    // -----------------------------------------------------------------------
    // Lookup helpers
    // -----------------------------------------------------------------------

    public static String get(String key) {
        String value = System.getProperty(key);
        if (value != null) return value;
        value = System.getenv(key.replace('.', '_').toUpperCase());
        if (value != null) return value;
        return PROPS.getProperty(key);
    }

    public static String get(String key, String defaultValue) {
        String value = get(key);
        return value != null ? value : defaultValue;
    }

    public static boolean getBoolean(String key, boolean defaultValue) {
        String value = get(key);
        return value != null ? Boolean.parseBoolean(value) : defaultValue;
    }

    public static int getInt(String key, int defaultValue) {
        String value = get(key);
        return value != null ? Integer.parseInt(value) : defaultValue;
    }

    // -----------------------------------------------------------------------
    // Typed accessors
    // -----------------------------------------------------------------------

    public static String baseUrl() {
        return get("base.url", "http://localhost:5173");
    }

    public static String backendUrl() {
        return get("backend.url", "http://localhost:4000");
    }

    public static String browser() {
        return get("playwright.browser", "chromium");
    }

    public static boolean headless() {
        return getBoolean("headless", true);
    }

    public static double slowMo() {
        return getInt("slow.mo", 0);
    }

    public static int defaultTimeout() {
        return getInt("default.timeout", 30_000);
    }

    public static int navigationTimeout() {
        return getInt("navigation.timeout", 30_000);
    }

    public static boolean screenshotOnFailure() {
        return getBoolean("screenshot.on.failure", true);
    }

    public static String videoRecording() {
        return get("video.recording", "retain-on-failure");
    }

    public static String traceRecording() {
        return get("trace.recording", "retain-on-failure");
    }

    // -----------------------------------------------------------------------
    // Seeded user credentials
    // -----------------------------------------------------------------------

    public static String customer1Email()    { return get("user.customer1.email"); }
    public static String customer1Password() { return get("user.customer1.password"); }
    public static String customer1Name()     { return get("user.customer1.name"); }

    public static String customer2Email()    { return get("user.customer2.email"); }
    public static String customer2Password() { return get("user.customer2.password"); }
    public static String customer2Name()     { return get("user.customer2.name"); }

    public static String managerEmail()      { return get("user.manager.email"); }
    public static String managerPassword()   { return get("user.manager.password"); }
    public static String managerName()       { return get("user.manager.name"); }
}
