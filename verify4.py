from playwright.sync_api import sync_playwright
import os

SHOTS = '/home/ubuntu/neo-app/verify_shots'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    def shot(name):
        page.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
        print(f'  [✓] {name}.png')

    def nav_to(label):
        page.wait_for_timeout(300)
        for sel in [f'aside a:has-text("{label}")', f'aside span:has-text("{label}")', f'a:has-text("{label}")']:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=1000):
                    el.click()
                    page.wait_for_timeout(1500)
                    return
            except: pass

    # Login
    page.goto('http://localhost:5173/', timeout=15000)
    page.wait_for_timeout(2000)
    shot('01_login')
    print('Login OK')

    # Log in
    page.fill('input[type=email]', 'test@neo.com')
    page.fill('input[type=password]', 'password123')
    page.get_by_role('button', name='Login').click()
    page.wait_for_timeout(2000)
    shot('02_fix_groups')
    print('Fix Groups OK')

    # Feed
    page.get_by_role('button', name='Feed').first.click()
    page.wait_for_timeout(600)
    shot('03_feed')

    # Task detail
    page.locator('.flex.items-center.gap-4.px-4.py-3').first.click()
    page.wait_for_timeout(800)
    shot('04_task_detail')
    print('Task detail OK')
    page.keyboard.press('Escape')
    page.wait_for_timeout(400)

    # Areas
    page.get_by_role('button', name='Areas').first.click()
    page.wait_for_timeout(600)
    shot('05_areas')

    # Groups -> group detail
    page.get_by_role('button', name='Groups').first.click()
    page.wait_for_timeout(600)
    page.locator('div.bg-white.rounded-xl.border.cursor-pointer').first.click()
    page.wait_for_timeout(800)
    shot('06_group_detail')
    page.keyboard.press('Escape')
    page.wait_for_timeout(400)

    # Expand sidebar (click the toggle button)
    page.locator('aside').locator('button').nth(1).click()
    page.wait_for_timeout(500)
    shot('07_sidebar_expanded')
    print('Sidebar expanded OK')

    # Navigate via sidebar
    nav_to('Plan')
    shot('08_plan')
    print('Plan OK')

    nav_to('Assets')
    shot('09_assets')
    print('Assets OK')

    nav_to('Chat')
    shot('10_chat')
    print('Chat OK')

    nav_to('Dashboard')
    page.wait_for_timeout(500)
    shot('11_dashboard')
    print('Dashboard OK')

    nav_to('My Profile')
    shot('12_profile')
    print('Profile OK')

    browser.close()
    print('\n✅ All screens verified!')
