package com.banking.automation.dashboard;

import com.banking.automation.BaseTest;
import com.banking.automation.config.TestConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Dashboard page.
 *
 * Covers:
 *  - Dashboard is accessible after login
 *  - Unauthenticated access to dashboard redirects to login
 *  - Customer does not see Users link
 *  - Manager sees Users link
 *  - Navigation links exist
 *  - Logout redirects to login page
 */
@DisplayName("Dashboard Tests")
class DashboardTest extends BaseTest {

    @Test
    @DisplayName("Customer reaches dashboard after login")
    void customerCanAccessDashboard() {
        loginAsCustomer();
        assertThat(dashboardPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Unauthenticated request to /dashboard redirects to login")
    void unauthenticatedAccessRedirectsToLogin() {
        page.navigate("/dashboard");
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Customer does not see the Users navigation link")
    void customerDoesNotSeeUsersLink() {
        loginAsCustomer();
        assertThat(dashboardPage.isUsersLinkVisible()).isFalse();
    }

    @Test
    @DisplayName("Manager sees the Users navigation link")
    void managerSeesUsersLink() {
        loginAsManager();
        assertThat(dashboardPage.isUsersLinkVisible()).isTrue();
    }

    @Test
    @DisplayName("Dashboard shows navigation links for Accounts, Transactions, Transfers")
    void dashboardHasCoreNavigationLinks() {
        loginAsCustomer();
        // Clicking these should not throw
        assertThat(page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new com.microsoft.playwright.Page.GetByRoleOptions().setName("Accounts")).isVisible()).isTrue();
        assertThat(page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new com.microsoft.playwright.Page.GetByRoleOptions().setName("Transactions")).isVisible()).isTrue();
        assertThat(page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new com.microsoft.playwright.Page.GetByRoleOptions().setName("Transfers")).isVisible()).isTrue();
    }

    @Test
    @DisplayName("Logout redirects to login page")
    void logoutRedirectsToLogin() {
        loginAsCustomer();
        dashboardPage.clickLogout();
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Dashboard shows logged-in user name")
    void dashboardShowsUserName() {
        loginAsCustomer();
        assertThat(dashboardPage.hasWelcomeMessage(TestConfig.customer1Name())).isTrue();
    }
}
