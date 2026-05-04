package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import java.util.List;

/**
 * Page Object for the Accounts page (/accounts).
 */
public class AccountsPage extends BasePage {

    public AccountsPage(Page page) {
        super(page);
    }

    public boolean isLoaded() {
        return page.url().contains("/accounts");
    }

    public int getAccountCount() {
        return page.locator("table tbody tr, .account-card, [data-testid='account-row']").count();
    }

    public boolean hasAccountWithId(String accountId) {
        return page.locator("text=" + accountId).isVisible();
    }

    public List<String> getAccountIds() {
        return page.locator("table tbody tr td:first-child").allTextContents();
    }

    public void clickAccountRow(int index) {
        page.locator("table tbody tr").nth(index).click();
    }

    public boolean isAccountListVisible() {
        return page.locator("table, .accounts-list, [data-testid='accounts-table']").isVisible();
    }

    public Locator getAccountRows() {
        return page.locator("table tbody tr");
    }
}
