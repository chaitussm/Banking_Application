package com.banking.automation.pages;

import com.microsoft.playwright.Page;

/**
 * Page Object for the Register page (/register).
 */
public class RegisterPage extends BasePage {

    public RegisterPage(Page page) {
        super(page);
    }

    public void enterFullName(String fullName) {
        page.getByLabel("Full Name").fill(fullName);
    }

    public void enterEmail(String email) {
        page.getByLabel("Email").fill(email);
    }

    public void enterPassword(String password) {
        page.getByLabel("Password").fill(password);
    }

    public void clickCreateAccount() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Create Account")).click();
    }

    public void register(String fullName, String email, String password) {
        enterFullName(fullName);
        enterEmail(email);
        enterPassword(password);
        clickCreateAccount();
    }

    public boolean isRegisterFormVisible() {
        return page.getByLabel("Full Name").isVisible();
    }

    public String getErrorMessage() {
        return page.locator(".error").textContent();
    }

    public boolean hasError() {
        return page.locator(".error").isVisible();
    }

    public void clickBackToLogin() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Login")).click();
    }
}
