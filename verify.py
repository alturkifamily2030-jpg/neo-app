from playwright.sync_api import sync_playwright
import os

SHOTS = '/home/ubuntu/neo-app/verify_shots'
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    def shot(name):
        page.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
        print(f'  [✓] {name}.png')

    # Login page
    page.goto('http://localhost:5173/', timeout=15000)
    page.wait_for_timeout(2000)
    shot('01_login')
    print('Login page OK')

    # Fill login and submit
    page.fill('input[type=email]', 'test@neo.com')
    page.fill('input[type=password]', 'password123')
    page.get_by_role('button', name='Login').click()
    page.wait_for_timeout(2000)
    shot('02_fix_groups')
    print(f'After login: {page.url}')

    # Fix - Feed tab
    page.get_by_role('button', name='Feed').first.click()
    page.wait_for_timeout(500)
    shot('03_fix_feed')
    print('Feed tab OK')

    # Fix - Areas tab
    page.get_by_role('button', name='Areas').first.click()
    page.wait_for_timeout(500)
    shot('04_fix_areas')
    print('Areas tab OK')

    # Click a group card back in groups
    page.get_by_role('button', name='Groups').first.click()
    page.wait_for_timeout(500)
    page.locator('.bg-white.rounded-xl.border.border-gray-200.p-4').first.click()
    page.wait_for_timeout(1000)
    shot('05_group_detail')
    print('Group detail OK')
    page.keyboard.press('Escape')

    # Plan page
    page.goto('http://localhost:5173/plan', timeout=10000)
    page.wait_for_timeout(1500)
    shot('06_plan')
    print('Plan page OK')

    # Assets page
    page.goto('http://localhost:5173/assets', timeout=10000)
    page.wait_for_timeout(1000)
    shot('07_assets')
    print('Assets page OK')

    # Chat page
    page.goto('http://localhost:5173/chat', timeout=10000)
    page.wait_for_timeout(1000)
    shot('08_chat')
    print('Chat page OK')

    # Dashboard page
    page.goto('http://localhost:5173/dashboard', timeout=10000)
    page.wait_for_timeout(1500)
    shot('09_dashboard')
    print('Dashboard page OK')

    # Profile page
    page.goto('http://localhost:5173/profile', timeout=10000)
    page.wait_for_timeout(1000)
    shot('10_profile')
    print('Profile page OK')

    # Sidebar expand
    page.goto('http://localhost:5173/fix', timeout=10000)
    page.wait_for_timeout(500)
    page.locator('button').filter(has_text='').first.click()
    page.wait_for_timeout(500)
    shot('11_sidebar_expanded')
    print('Sidebar expand OK')

    browser.close()
    print('\n✅ All verified!')
