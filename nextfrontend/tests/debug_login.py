from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

USERS = [
    ("alumno@test.com", "Alumno5366!"),
    ("sensei@toseigusoku.com", "Sensei5366!"),
    ("admin@toseigusoku.com", "Admin5366!"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for email, password in USERS:
        context = browser.new_context()
        page = context.new_page()

        csrf_response = page.request.get(f"{BASE_URL}/api/auth/csrf")
        csrf_token = csrf_response.json()["csrfToken"]

        callback_response = page.request.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            form={
                "email": email,
                "password": password,
                "csrfToken": csrf_token,
                "callbackUrl": f"{BASE_URL}/dashboard",
                "json": "true",
            }
        )

        final_url = callback_response.url
        success = "error" not in final_url
        print(f"{'✓' if success else '✗'} {email}: {final_url.split('?')[1] if '?' in final_url else 'OK'}")
        context.close()

    browser.close()
