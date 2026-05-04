package com.banking.automation.auth;

import com.banking.automation.BaseTest;
import com.banking.automation.utils.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Register page.
 *
 * Covers:
 *  - Register page is accessible
 *  - Successful registration redirects to dashboard
 *  - Duplicate email shows error
 *  - Back to login navigation
 */
@DisplayName("Register Tests")
class RegisterTest extends BaseTest {

    @Test
    @DisplayName("Register page is accessible at /register")
    void registerPageIsAccessible() {
        page.navigate("/register");
        assertThat(registerPage.isRegisterFormVisible()).isTrue();
    }

    @Test
    @DisplayName("New user can register and is redirected to dashboard")
    void successfulRegistrationRedirectsToDashboard() {
        page.navigate("/register");
        String email = TestDataFactory.uniqueEmail();
        registerPage.register(TestDataFactory.uniqueFullName(), email, TestDataFactory.defaultPassword());
        page.waitForURL("**/dashboard");
        assertThat(dashboardPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Registering with an existing email shows an error")
    void duplicateEmailShowsError() {
        page.navigate("/register");
        // Use a known seeded email
        registerPage.register("Duplicate User", "ava.smith@novabank.com", TestDataFactory.defaultPassword());
        assertThat(registerPage.hasError()).isTrue();
        assertThat(registerPage.getErrorMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Back to login link navigates to login page")
    void backToLoginLink() {
        page.navigate("/register");
        registerPage.clickBackToLogin();
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Registering with empty name keeps user on register page")
    void registerWithEmptyNameShowsValidation() {
        page.navigate("/register");
        registerPage.enterEmail(TestDataFactory.uniqueEmail());
        registerPage.enterPassword(TestDataFactory.defaultPassword());
        registerPage.clickCreateAccount();
        // HTML5 or server-side validation should prevent success
        boolean stayedOnRegister = page.url().contains("/register");
        boolean showedError = registerPage.hasError();
        assertThat(stayedOnRegister || showedError).isTrue();
    }
}
