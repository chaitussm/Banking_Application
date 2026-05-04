package com.banking.automation.users;

import com.banking.automation.BaseTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests for the Users page (manager-only).
 *
 * Covers:
 *  - Manager can access the Users page
 *  - Customer accessing /users is redirected to /unauthorized
 *  - Users list shows seeded users
 */
@DisplayName("Users Page Tests")
class UsersTest extends BaseTest {

    @Test
    @DisplayName("Manager can access the Users page")
    void managerCanAccessUsersPage() {
        loginAsManager();
        page.navigate("/users");
        page.waitForURL("**/users");
        assertThat(usersPage.isLoaded()).isTrue();
    }

    @Test
    @DisplayName("Manager Users page shows a list of users")
    void managerUsersPageShowsList() {
        loginAsManager();
        page.navigate("/users");
        page.waitForURL("**/users");
        assertThat(usersPage.isUserListVisible()).isTrue();
        assertThat(usersPage.getUserCount()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Customer accessing /users is redirected to /unauthorized")
    void customerRedirectedToUnauthorized() {
        loginAsCustomer();
        page.navigate("/users");
        page.waitForURL("**/unauthorized");
        assertThat(page.url()).contains("/unauthorized");
    }

    @Test
    @DisplayName("Unauthenticated access to /users redirects to login")
    void unauthenticatedAccessRedirectsToLogin() {
        page.navigate("/users");
        page.waitForURL("**/login");
        assertThat(page.url()).contains("/login");
    }

    @Test
    @DisplayName("Users list contains known seeded user emails")
    void usersListContainsSeededUsers() {
        loginAsManager();
        page.navigate("/users");
        page.waitForURL("**/users");
        assertThat(usersPage.hasUserWithEmail("ava.smith@novabank.com")).isTrue();
    }
}
