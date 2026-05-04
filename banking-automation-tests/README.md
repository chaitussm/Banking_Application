# Banking Application – Playwright Java Automation Tests

End-to-end (E2E) automation test suite for the [Banking Application](https://github.com/chaitussm/Banking_Application) using **Playwright for Java** and **JUnit 5**.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright for Java](https://playwright.dev/java/) | 1.44.0 | Browser automation |
| JUnit 5 (Jupiter) | 5.10.2 | Test runner and assertions |
| AssertJ | 3.25.3 | Fluent assertions |
| Maven | 3.9+ | Build and dependency management |
| Java | 11+ | Runtime |
| Logback | 1.5.6 | Logging |

---

## Project Structure

```
banking-automation-tests/
├── pom.xml                                        # Maven build + browser profiles
├── src/
│   ├── main/java/com/banking/automation/
│   │   ├── config/
│   │   │   └── TestConfig.java                   # Centralized configuration
│   │   ├── pages/
│   │   │   ├── BasePage.java                     # Shared page helpers
│   │   │   ├── LoginPage.java
│   │   │   ├── RegisterPage.java
│   │   │   ├── ForgotPasswordPage.java
│   │   │   ├── DashboardPage.java
│   │   │   ├── AccountsPage.java
│   │   │   ├── TransactionsPage.java
│   │   │   ├── TransfersPage.java
│   │   │   └── UsersPage.java
│   │   └── utils/
│   │       └── TestDataFactory.java              # Unique test data generation
│   └── test/
│       ├── java/com/banking/automation/
│       │   ├── BaseTest.java                     # Browser/context lifecycle + helpers
│       │   ├── auth/
│       │   │   ├── LoginTest.java
│       │   │   ├── RegisterTest.java
│       │   │   └── ForgotPasswordTest.java
│       │   ├── dashboard/
│       │   │   └── DashboardTest.java
│       │   ├── accounts/
│       │   │   └── AccountsTest.java
│       │   ├── transactions/
│       │   │   └── TransactionsTest.java
│       │   ├── transfers/
│       │   │   └── TransfersTest.java
│       │   └── users/
│       │       └── UsersTest.java
│       └── resources/
│           ├── test.properties                   # Test configuration
│           └── logback-test.xml                  # Logging config
└── .github/workflows/
    └── playwright-tests.yml                      # GitHub Actions CI pipeline
```

---

## Prerequisites

- Java 11 or higher
- Maven 3.9+
- Banking Application running locally:
  - **Backend** on `http://localhost:4000`
  - **Frontend** on `http://localhost:5173`

### Start the Banking Application

```bash
# Terminal 1 – backend
cd <banking-app>/backend
npm install
npm run dev

# Terminal 2 – frontend
cd <banking-app>/frontend
npm install
npm run dev
```

---

## Run Tests

### Install Playwright browsers (first time)

```bash
mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install --with-deps"
```

### Run all tests (Chromium, headless)

```bash
mvn test
```

### Run on a specific browser

```bash
# Firefox
mvn test -P firefox

# WebKit (Safari engine)
mvn test -P webkit

# Chromium (default)
mvn test -P chromium
```

### Run in headed mode (visible browser)

```bash
mvn test -Dheadless=false
```

### Run a specific test class

```bash
mvn test -Dtest=LoginTest
```

### Run a specific test method

```bash
mvn test -Dtest=LoginTest#customerLoginSuccess
```

### Override configuration at runtime

```bash
mvn test \
  -Dbase.url=http://staging.example.com \
  -Dplaywright.browser=firefox \
  -Dheadless=false \
  -Dslow.mo=500
```

---

## Configuration Reference

All settings live in `src/test/resources/test.properties` and can be overridden via:
1. `-D<key>=<value>` on the Maven command line  
2. Environment variable `KEY_NAME` (dots → underscores, uppercased)

| Property | Default | Description |
|----------|---------|-------------|
| `base.url` | `http://localhost:5173` | Frontend base URL |
| `backend.url` | `http://localhost:4000` | Backend base URL |
| `playwright.browser` | `chromium` | `chromium` / `firefox` / `webkit` |
| `headless` | `true` | Run browser headless |
| `slow.mo` | `0` | Slow motion delay (ms) |
| `default.timeout` | `30000` | Default action timeout (ms) |
| `navigation.timeout` | `30000` | Navigation timeout (ms) |
| `screenshot.on.failure` | `true` | Capture screenshot on failure |
| `video.recording` | `retain-on-failure` | `off` / `on` / `retain-on-failure` |
| `trace.recording` | `retain-on-failure` | `off` / `on` / `retain-on-failure` |

---

## Test Artifacts

After a test run, artifacts are saved under `target/`:

| Path | Content |
|------|---------|
| `target/surefire-reports/` | JUnit XML and HTML reports |
| `target/videos/` | Browser video recordings |
| `target/traces/` | Playwright trace files (open with `npx playwright show-trace <file>`) |

### View a trace file

```bash
npx playwright show-trace target/traces/<test-name>.zip
```

---

## CI / CD

The GitHub Actions workflow at `.github/workflows/playwright-tests.yml` automatically:

1. Checks out this repository and the Banking Application source
2. Installs Node.js, starts the backend and frontend
3. Sets up Java 11 and Maven
4. Installs Playwright browser binaries
5. Runs the full test suite
6. Uploads traces, videos, and Surefire reports as artifacts on failure

---

## Design Patterns

- **Page Object Model (POM)**: Each page of the application has a dedicated class under `src/main/java/.../pages/`.
- **BaseTest**: Manages browser/context/page lifecycle; provides `loginAs*()` helpers.
- **TestConfig**: Single source for all configuration with a priority resolution chain (system property → env var → properties file).
- **TestDataFactory**: Generates unique, collision-free test data for each run.

---

## Seeded Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Ava Smith | ava.smith@novabank.com | ava@123 | customer |
| Noah Patel | noah.patel@novabank.com | noah@123 | customer |
| Mia Johnson | mia.johnson@novabank.com | mia@123 | manager |
