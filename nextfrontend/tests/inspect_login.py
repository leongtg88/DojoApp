from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    page.screenshot(path="tests/screenshots/login.png", full_page=True)

    # Ver todos los inputs
    inputs = page.locator("input").all()
    print(f"Inputs encontrados: {len(inputs)}")
    for inp in inputs:
        print(f"  type={inp.get_attribute('type')} name={inp.get_attribute('name')} id={inp.get_attribute('id')} placeholder={inp.get_attribute('placeholder')}")

    # Ver todos los botones
    buttons = page.locator("button").all()
    print(f"\nBotones: {len(buttons)}")
    for b in buttons:
        print(f"  type={b.get_attribute('type')} text='{b.inner_text().strip()}'")

    # Ver el form
    forms = page.locator("form").all()
    print(f"\nForms: {len(forms)}")
    for f in forms:
        print(f"  action={f.get_attribute('action')} method={f.get_attribute('method')}")

    browser.close()
