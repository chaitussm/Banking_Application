package com.banking.automation.pages;

import com.microsoft.playwright.Page;

/**
 * Page Object for the Login page (/login or /).
 */
public class LoginPage extends BasePage {

    public LoginPage(Page page) {
        super(page);
    }

    public void navigateTo() {
        navigate(page.url().contains("localhost") ? page.url().replaceAll("(https?://[^/]+).*", "$1/login") : "/login");
    }

    public void enterEmail(String email) {
        page.getByLabel("Email").fill(email);
    }

    public void enterPassword(String password) {
        page.getByLabel("Password").fill(password);
    }

    public void clickSignIn() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Sign In")).click();
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSignIn();
    }

    public void clickCreateAccount() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Create account")).click();
    }

    public void clickForgotPassword() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Reset password")).click();
    }

    public boolean isLoginFormVisible() {
        return page.getByLabel("Email").isVisible() && page.getByLabel("Password").isVisible();
    }

    public String getErrorMessage() {
        return page.locator(".error").textContent();
    }

    public boolean hasError() {
        return page.locator(".error").isVisible();
    }
}
