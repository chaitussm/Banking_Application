package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/**
 * Page Object for the Users page (/users) – manager-only.
 */
public class UsersPage extends BasePage {

    public UsersPage(Page page) {
        super(page);
    }

    public boolean isLoaded() {
        return page.url().contains("/users");
    }

    public boolean isUserListVisible() {
        return page.locator("table, .users-list, [data-testid='users-table']").isVisible();
    }

    public int getUserCount() {
        return page.locator("table tbody tr, .user-row").count();
    }

    public boolean hasUserWithEmail(String email) {
        return page.locator("text=" + email).isVisible();
    }

    public Locator getUserRows() {
        return page.locator("table tbody tr");
    }
}
