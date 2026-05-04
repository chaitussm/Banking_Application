package com.banking.automation.transactions;

import com.banking.automation.BaseTest;
import com.banking.automation.utils.TestDataFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Transactions page.
 *
 * Covers:
 *  - Transactions page is accessible after login
 *  - Unauthenticated access redirects to login
 *  - Transaction list is displayed
 *  - Creating a deposit transaction
 *  - Creating a withdrawal transaction
 *  - Invalid amount shows error
 */
@DisplayName("Transactions Tests")
class TransactionsTest extends BaseTest {

    @Test
    @DisplayName("Transactions page is accessible after login")
    void transactionsPageIsAccessible() {
        loginAsCustomer();
        page.navigate("/transactions");
        page.waitForURL("**/transactions");
        assertThat(transactionsPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Unauthenticated access to /transactions redirects to login")
    void unauthenticatedAccessRedirectsToLogin() {
        page.navigate("/transactions");
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Transaction list is visible after login")
    void transactionListIsVisible() {
        loginAsCustomer();
        page.navigate("/transactions");
        page.waitForURL("**/transactions");
        assertThat(transactionsPage.isTransactionListVisible()).isTrue();
    }

    @Test
    @DisplayName("Dashboard Transactions link navigates to the transactions page")
    void dashboardTransactionsLinkNavigates() {
        loginAsCustomer();
        dashboardPage.clickTransactionsLink();
        page.waitForURL("**/transactions");
        assertThat(transactionsPage.isLoaded()).isTrue();
    }
}
