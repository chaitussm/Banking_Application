package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/**
 * Page Object for the Transactions page (/transactions).
 */
public class TransactionsPage extends BasePage {

    public TransactionsPage(Page page) {
        super(page);
    }

    public boolean isLoaded() {
        return page.url().contains("/transactions");
    }

    public void selectAccount(String accountId) {
        page.locator("select, [data-testid='account-select']").selectOption(accountId);
    }

    public void enterAmount(String amount) {
        page.getByLabel("Amount").fill(amount);
    }

    public void enterNote(String note) {
        page.getByLabel("Note").fill(note);
    }

    public void selectKind(String kind) {
        page.locator("select[name='kind'], [data-testid='kind-select']").selectOption(kind);
    }

    public void clickCreateTransaction() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Create")).click();
    }

    public void createTransaction(String accountId, String kind, String amount, String note) {
        selectAccount(accountId);
        selectKind(kind);
        enterAmount(amount);
        enterNote(note);
        clickCreateTransaction();
    }

    public int getTransactionCount() {
        return page.locator("table tbody tr, .transaction-row").count();
    }

    public boolean isTransactionListVisible() {
        return page.locator("table, .transactions-list").isVisible();
    }

    public Locator getTransactionRows() {
        return page.locator("table tbody tr");
    }

    public boolean hasError() {
        return page.locator(".error").isVisible();
    }
}
