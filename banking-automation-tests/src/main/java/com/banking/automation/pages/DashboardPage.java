package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/**
 * Page Object for the Dashboard page (/dashboard).
 */
public class DashboardPage extends BasePage {

    public DashboardPage(Page page) {
        super(page);
    }

    public boolean isLoaded() {
        return page.url().contains("/dashboard");
    }

    public boolean hasWelcomeMessage(String userName) {
        return page.locator("text=" + userName).isVisible()
                || page.getByText("Welcome").isVisible();
    }

    public void clickAccountsLink() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Accounts")).click();
    }

    public void clickTransactionsLink() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Transactions")).click();
    }

    public void clickTransfersLink() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Transfers")).click();
    }

    public void clickUsersLink() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Users")).click();
    }

    public void clickLogout() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Logout")).click();
    }

    public boolean isUsersLinkVisible() {
        Locator link = page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Users"));
        return link.isVisible();
    }
}
