package com.banking.automation.auth;

import com.banking.automation.BaseTest;
import com.banking.automation.config.TestConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Login page.
 *
 * Covers:
 *  - Successful login as customer
 *  - Successful login as manager
 *  - Invalid credentials show error
 *  - Empty fields show validation error
 *  - Navigation to Register and Forgot Password pages
 */
@DisplayName("Login Tests")
class LoginTest extends BaseTest {

    @Test
    @DisplayName("Login page is accessible at /login")
    void loginPageIsAccessible() {
        page.navigate("/login");
        assertThat(loginPage.isLoginFormVisible()).isTrue();
    }

    @Test
    @DisplayName("Customer can login with valid credentials and reaches dashboard")
    void customerLoginSuccess() {
        page.navigate("/login");
        loginPage.login(TestConfig.customer1Email(), TestConfig.customer1Password());
        page.waitForURL("**/dashboard");
        assertThat(dashboardPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Manager can login with valid credentials and reaches dashboard")
    void managerLoginSuccess() {
        page.navigate("/login");
        loginPage.login(TestConfig.managerEmail(), TestConfig.managerPassword());
        page.waitForURL("**/dashboard");
        assertThat(dashboardPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Invalid password shows error message")
    void loginWithWrongPasswordShowsError() {
        page.navigate("/login");
        loginPage.login(TestConfig.customer1Email(), "wrong_password");
        assertThat(loginPage.hasError()).isTrue();
        assertThat(loginPage.getErrorMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Non-existent email shows error message")
    void loginWithUnknownEmailShowsError() {
        page.navigate("/login");
        loginPage.login("nobody@novabank.com", "Password@123");
        assertThat(loginPage.hasError()).isTrue();
    }

    @ParameterizedTest(name = "Login with empty {0} shows validation")
    @CsvSource({
        "email, '', Password@123",
        "password, ava.smith@novabank.com, ''"
    })
    @DisplayName("Empty required fields prevent form submission")
    void loginWithEmptyFieldsIsInvalid(String field, String email, String password) {
        page.navigate("/login");
        // HTML5 required validation prevents submission; just verify form is still shown
        loginPage.enterEmail(email);
        loginPage.enterPassword(password);
        loginPage.clickSignIn();
        // Should remain on login page or show an error
        boolean stayedOnLogin = page.url().contains("/login");
        boolean showedError = loginPage.hasError();
        assertThat(stayedOnLogin || showedError).isTrue();
    }

    @Test
    @DisplayName("Create account link navigates to register page")
    void createAccountLinkNavigatesToRegister() {
        page.navigate("/login");
        loginPage.clickCreateAccount();
        page.waitForURL("**/register");
        assertThat(page.url()).contains("/register");
    }

    @Test
    @DisplayName("Forgot password link navigates to forgot-password page")
    void forgotPasswordLinkNavigates() {
        page.navigate("/login");
        loginPage.clickForgotPassword();
        page.waitForURL("**/forgot-password");
        assertThat(page.url()).contains("/forgot-password");
    }
}
