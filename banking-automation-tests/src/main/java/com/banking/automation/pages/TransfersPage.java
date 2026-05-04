package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/**
 * Page Object for the Transfers page (/transfers).
 */
public class TransfersPage extends BasePage {

    public TransfersPage(Page page) {
        super(page);
    }

    public boolean isLoaded() {
        return page.url().contains("/transfers");
    }

    public void selectFromAccount(String accountId) {
        page.locator("select[name='fromAccountId'], [data-testid='from-account']")
                .selectOption(accountId);
    }

    public void selectToAccount(String accountId) {
        page.locator("select[name='toAccountId'], [data-testid='to-account']")
                .selectOption(accountId);
    }

    public void enterAmount(String amount) {
        page.getByLabel("Amount").fill(amount);
    }

    public void enterNote(String note) {
        page.getByLabel("Note").fill(note);
    }

    public void clickTransfer() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Transfer")).click();
    }

    public void performTransfer(String fromAccountId, String toAccountId, String amount, String note) {
        selectFromAccount(fromAccountId);
        selectToAccount(toAccountId);
        enterAmount(amount);
        enterNote(note);
        clickTransfer();
    }

    public boolean isTransferFormVisible() {
        return page.getByLabel("Amount").isVisible();
    }

    public boolean hasError() {
        return page.locator(".error").isVisible();
    }

    public String getErrorMessage() {
        return page.locator(".error").textContent();
    }

    public boolean hasSuccessMessage() {
        return page.locator(".success, [class*='success']").isVisible();
    }

    public Locator getTransferRows() {
        return page.locator("table tbody tr");
    }
}
