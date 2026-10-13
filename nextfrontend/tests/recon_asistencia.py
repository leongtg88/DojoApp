from playwright.sync_api import sync_playwright

EMAIL = "alumno@test.com"
PASSWORD = "Alumno5366!"
BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    logs = []
    page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))

    # Login con selectores exactos
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.fill("#login-email-input", EMAIL)
    page.fill("#login-password-input", PASSWORD)

    page.click('button[type="submit"]')
    # Esperar a que salga del login (redirect post-auth)
    page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
    page.wait_for_load_state("networkidle")
    print(f"Post-login URL: {page.url}")

    # Navegar a asistencia
    page.goto(f"{BASE_URL}/dashboard/estudiante/asistencia")
    page.wait_for_load_state("networkidle")
    print(f"URL asistencia: {page.url}")

    page.screenshot(path="tests/screenshots/asistencia_full.png", full_page=True)
    print("Screenshot guardado")

    # Títulos
    h1 = page.locator("h1").all()
    print(f"\nH1: {[h.inner_text() for h in h1]}")
    h3 = page.locator("h3").all()
    print(f"H3: {[h.inner_text() for h in h3]}")

    # Componente StudentAbsenceReport
    details = page.locator("details").all()
    print(f"\nElementos <details>: {len(details)}")
    for i, d in enumerate(details):
        summary = d.locator("summary").first
        print(f"  [{i}] summary: '{summary.inner_text().strip()[:80]}'")
        print(f"       open: {d.get_attribute('open')}")

    # Botones
    buttons = page.locator("button").all()
    print(f"\nBotones: {len(buttons)}")
    for b in buttons:
        txt = b.inner_text().strip()
        print(f"  - '{txt[:60]}' | visible: {b.is_visible()}")

    # Formulario
    selects = page.locator("select").all()
    print(f"\nSelects: {len(selects)}")
    inputs = page.locator("input").all()
    print(f"Inputs: {len(inputs)}")
    textareas = page.locator("textarea").all()
    print(f"Textareas: {len(textareas)}")

    if logs:
        errors = [l for l in logs if "error" in l.lower()]
        if errors:
            print(f"\nConsole errors:")
            for log in errors:
                print(f"  {log}")

    browser.close()
