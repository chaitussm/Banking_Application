package com.banking.automation.auth;

import com.banking.automation.BaseTest;
import com.banking.automation.config.TestConfig;
import com.banking.automation.utils.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Forgot Password page.
 *
 * Covers:
 *  - Page is accessible
 *  - Resetting password for a known email succeeds
 *  - Unknown email shows error
 *  - After reset, user can login with new password
 */
@DisplayName("Forgot Password Tests")
class ForgotPasswordTest extends BaseTest {

    @Test
    @DisplayName("Forgot password page is accessible at /forgot-password")
    void forgotPasswordPageIsAccessible() {
        page.navigate("/forgot-password");
        assertThat(forgotPasswordPage.isFormVisible()).isTrue();
    }

    @Test
    @DisplayName("Resetting password for known user shows success feedback")
    void resetPasswordForKnownUser() {
        page.navigate("/forgot-password");
        forgotPasswordPage.resetPassword(TestConfig.customer2Email(), "NewPassword@456");
        // Should either show success or redirect to login
        boolean onLogin = page.url().contains("/login");
        boolean hasSuccess = forgotPasswordPage.hasSuccessMessage();
        assertThat(onLogin || hasSuccess).isTrue();
    }

    @Test
    @DisplayName("Resetting password for unknown email shows error")
    void resetPasswordForUnknownEmailShowsError() {
        page.navigate("/forgot-password");
        forgotPasswordPage.resetPassword("nonexistent@novabank.com", TestDataFactory.defaultPassword());
        assertThat(forgotPasswordPage.hasError()).isTrue();
    }

    @Test
    @DisplayName("After password reset user can login with new password")
    void afterResetUserCanLoginWithNewPassword() {
        String newPassword = "Updated@789";

        // Reset password for customer2
        page.navigate("/forgot-password");
        forgotPasswordPage.resetPassword(TestConfig.customer2Email(), newPassword);

        // Now login with the new password
        page.navigate("/login");
        loginPage.login(TestConfig.customer2Email(), newPassword);
        page.waitForURL("**/dashboard");
        assertThat(dashboardPage.isLoaded()).isTrue();

        // Restore original password so other tests are unaffected
        page.navigate("/forgot-password");
        forgotPasswordPage.resetPassword(TestConfig.customer2Email(), TestConfig.customer2Password());
    }
}
