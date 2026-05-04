package com.banking.automation.accounts;

import com.banking.automation.BaseTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Accounts page.
 *
 * Covers:
 *  - Accounts page is accessible after login
 *  - Unauthenticated access redirects to login
 *  - Account list is displayed with at least one account
 *  - Navigating from dashboard to accounts works
 */
@DisplayName("Accounts Tests")
class AccountsTest extends BaseTest {

    @Test
    @DisplayName("Accounts page is accessible after login")
    void accountsPageIsAccessible() {
        loginAsCustomer();
        page.navigate("/accounts");
        page.waitForURL("**/accounts");
        assertThat(accountsPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Unauthenticated access to /accounts redirects to login")
    void unauthenticatedAccessRedirectsToLogin() {
        page.navigate("/accounts");
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Accounts list is visible and contains seeded accounts")
    void accountListIsVisible() {
        loginAsCustomer();
        page.navigate("/accounts");
        page.waitForURL("**/accounts");
        assertThat(accountsPage.isAccountListVisible()).isTrue();
        assertThat(accountsPage.getAccountCount()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Dashboard Accounts link navigates to the accounts page")
    void dashboardAccountsLinkNavigates() {
        loginAsCustomer();
        dashboardPage.clickAccountsLink();
        page.waitForURL("**/accounts");
        assertThat(accountsPage.isLoaded()).isTrue();
    }
}
