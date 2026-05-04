package com.banking.automation.pages;

import com.microsoft.playwright.Page;

/**
 * Page Object for the Forgot Password page (/forgot-password).
 */
public class ForgotPasswordPage extends BasePage {

    public ForgotPasswordPage(Page page) {
        super(page);
    }

    public void enterEmail(String email) {
        page.getByLabel("Email").fill(email);
    }

    public void enterNewPassword(String newPassword) {
        page.getByLabel("New Password").fill(newPassword);
    }

    public void clickResetPassword() {
        page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Reset Password")).click();
    }

    public void resetPassword(String email, String newPassword) {
        enterEmail(email);
        enterNewPassword(newPassword);
        clickResetPassword();
    }

    public boolean isFormVisible() {
        return page.getByLabel("Email").isVisible()
                && page.getByLabel("New Password").isVisible();
    }

    public String getErrorMessage() {
        return page.locator(".error").textContent();
    }

    public boolean hasError() {
        return page.locator(".error").isVisible();
    }

    public boolean hasSuccessMessage() {
        return page.locator(".success, [class*='success']").isVisible();
    }
}
