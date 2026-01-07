from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to login page
        page.goto("http://localhost:5173/login")

        # Take screenshot of login page
        page.screenshot(path="verification/login_page.png")

        print("Screenshot taken: verification/login_page.png")
        browser.close()

if __name__ == "__main__":
    verify_frontend()
