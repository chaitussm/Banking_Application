package com.banking.automation.transfers;

import com.banking.automation.BaseTest;
import com.banking.automation.utils.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Transfers page.
 *
 * Covers:
 *  - Transfers page is accessible after login
 *  - Unauthenticated access redirects to login
 *  - Transfer form is visible
 *  - Dashboard Transfers link navigation
 */
@DisplayName("Transfers Tests")
class TransfersTest extends BaseTest {

    @Test
    @DisplayName("Transfers page is accessible after login")
    void transfersPageIsAccessible() {
        loginAsCustomer();
        page.navigate("/transfers");
        page.waitForURL("**/transfers");
        assertThat(transfersPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Unauthenticated access to /transfers redirects to login")
    void unauthenticatedAccessRedirectsToLogin() {
        page.navigate("/transfers");
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Transfer form is visible on the transfers page")
    void transferFormIsVisible() {
        loginAsCustomer();
        page.navigate("/transfers");
        page.waitForURL("**/transfers");
        assertThat(transfersPage.isTransferFormVisible()).isTrue();
    }

    @Test
    @DisplayName("Dashboard Transfers link navigates to the transfers page")
    void dashboardTransfersLinkNavigates() {
        loginAsCustomer();
        dashboardPage.clickTransfersLink();
        page.waitForURL("**/transfers");
        assertThat(transfersPage.isLoaded()).isTrue();
    }
}
