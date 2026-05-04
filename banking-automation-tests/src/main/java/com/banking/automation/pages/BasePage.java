package com.banking.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;

/**
 * Base page that all page objects extend.
 * Provides common navigation and assertion helpers.
 */
public abstract class BasePage {

    protected final Page page;

    protected BasePage(Page page) {
        this.page = page;
    }

    /** Navigate to the given path relative to the base URL. */
    public void navigate(String path) {
        page.navigate(path, new Page.NavigateOptions().setWaitUntil(WaitUntilState.NETWORKIDLE));
    }

    /** Wait for a specific URL pattern. */
    public void waitForUrl(String urlPattern) {
        page.waitForURL(urlPattern);
    }

    /** Returns the current page URL. */
    public String currentUrl() {
        return page.url();
    }

    /** Returns page title. */
    public String title() {
        return page.title();
    }

    /** Returns a locator for a heading that contains the given text. */
    public Locator heading(String text) {
        return page.getByRole(com.microsoft.playwright.options.AriaRole.HEADING,
                new Page.GetByRoleOptions().setName(text));
    }

    /** Returns whether an error message containing the text is visible. */
    public boolean hasErrorContaining(String text) {
        return page.locator(".error").filter(new Locator.FilterOptions().setHasText(text)).isVisible();
    }
}
