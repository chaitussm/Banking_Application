package com.banking.automation;

import com.banking.automation.config.TestConfig;
import com.banking.automation.pages.*;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.RecordVideoSize;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Paths;

/**
 * Base test class that manages Playwright lifecycle (Playwright → Browser → BrowserContext → Page).
 *
 * <ul>
 *   <li>One {@link Playwright} instance per test class (thread).</li>
 *   <li>One {@link Browser} instance per test class.</li>
 *   <li>One fresh {@link BrowserContext} and {@link Page} per test method.</li>
 * </ul>
 *
 * All page objects are created here and available to subclasses.
 */
public abstract class BaseTest {

    protected static final Logger log = LoggerFactory.getLogger(BaseTest.class);

    // Shared across all tests in a class
    protected static Playwright playwright;
    protected static Browser browser;

    // Per-test
    protected BrowserContext context;
    protected Page page;

    // Page Objects
    protected LoginPage loginPage;
    protected RegisterPage registerPage;
    protected ForgotPasswordPage forgotPasswordPage;
    protected DashboardPage dashboardPage;
    protected AccountsPage accountsPage;
    protected TransactionsPage transactionsPage;
    protected TransfersPage transfersPage;
    protected UsersPage usersPage;

    // -----------------------------------------------------------------------
    // Class-level lifecycle
    // -----------------------------------------------------------------------

    @BeforeAll
    static void launchBrowser() {
        playwright = Playwright.create();
        BrowserType.LaunchOptions opts = new BrowserType.LaunchOptions()
                .setHeadless(TestConfig.headless())
                .setSlowMo(TestConfig.slowMo());

        String browserName = TestConfig.browser().toLowerCase();
        if ("firefox".equals(browserName)) {
            browser = playwright.firefox().launch(opts);
        } else if ("webkit".equals(browserName)) {
            browser = playwright.webkit().launch(opts);
        } else {
            browser = playwright.chromium().launch(opts);
        }

        log.info("Browser launched: {} (headless={})", TestConfig.browser(), TestConfig.headless());
    }

    @AfterAll
    static void closeBrowser() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
        log.info("Browser closed.");
    }

    // -----------------------------------------------------------------------
    // Method-level lifecycle
    // -----------------------------------------------------------------------

    @BeforeEach
    void createContextAndPage(TestInfo testInfo) {
        Browser.NewContextOptions contextOpts = new Browser.NewContextOptions()
                .setBaseURL(TestConfig.baseUrl())
                .setViewportSize(1280, 800);

        if (!"off".equalsIgnoreCase(TestConfig.videoRecording())) {
            contextOpts.setRecordVideoDir(Paths.get("target/videos/"))
                       .setRecordVideoSize(new RecordVideoSize(1280, 800));
        }

        context = browser.newContext(contextOpts);
        context.setDefaultTimeout(TestConfig.defaultTimeout());
        context.setDefaultNavigationTimeout(TestConfig.navigationTimeout());

        if (!"off".equalsIgnoreCase(TestConfig.traceRecording())) {
            context.tracing().start(new Tracing.StartOptions()
                    .setScreenshots(true)
                    .setSnapshots(true)
                    .setSources(false));
        }

        page = context.newPage();

        // Instantiate page objects
        loginPage         = new LoginPage(page);
        registerPage      = new RegisterPage(page);
        forgotPasswordPage = new ForgotPasswordPage(page);
        dashboardPage     = new DashboardPage(page);
        accountsPage      = new AccountsPage(page);
        transactionsPage  = new TransactionsPage(page);
        transfersPage     = new TransfersPage(page);
        usersPage         = new UsersPage(page);

        log.info("Starting test: {}", testInfo.getDisplayName());
    }

    @AfterEach
    void closeContextAndPage(TestInfo testInfo) {
        boolean testFailed = testInfo.getTags().contains("FAILED");

        if (!"off".equalsIgnoreCase(TestConfig.traceRecording())) {
            String safeName = testInfo.getDisplayName().replaceAll("[^a-zA-Z0-9_-]", "_");
            boolean saveTrace = "on".equalsIgnoreCase(TestConfig.traceRecording())
                    || (testFailed && "retain-on-failure".equalsIgnoreCase(TestConfig.traceRecording()));
            if (saveTrace) {
                context.tracing().stop(new Tracing.StopOptions()
                        .setPath(Paths.get("target/traces/" + safeName + ".zip")));
            } else {
                context.tracing().stop();
            }
        }

        if (page != null) page.close();
        if (context != null) context.close();

        log.info("Finished test: {}", testInfo.getDisplayName());
    }

    // -----------------------------------------------------------------------
    // Convenience helpers
    // -----------------------------------------------------------------------

    /** Navigate to the login page and perform a login. Returns DashboardPage. */
    protected DashboardPage loginAs(String email, String password) {
        page.navigate("/login");
        loginPage.login(email, password);
        page.waitForURL("**/dashboard");
        return dashboardPage;
    }

    /** Login as a seeded customer (Ava Smith). */
    protected DashboardPage loginAsCustomer() {
        return loginAs(TestConfig.customer1Email(), TestConfig.customer1Password());
    }

    /** Login as the seeded manager (Mia Johnson). */
    protected DashboardPage loginAsManager() {
        return loginAs(TestConfig.managerEmail(), TestConfig.managerPassword());
    }
}
