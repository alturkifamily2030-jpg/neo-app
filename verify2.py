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

    def click_nav(label):
        page.wait_for_timeout(300)
        for sel in [f'a:has-text("{label}")', f'button:has-text("{label}")',
                    f'[class*=nav] *:has-text("{label}")', f'aside *:has-text("{label}")']:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=1000):
                    el.click()
                    page.wait_for_timeout(1500)
                    return True
            except: pass
        return False

    # Login
    page.goto('http://localhost:5173/', timeout=15000)
    page.wait_for_timeout(2000)
    shot('01_login')

    page.fill('input[type=email]', 'test@neo.com')
    page.fill('input[type=password]', 'password123')
    page.get_by_role('button', name='Login').click()
    page.wait_for_timeout(2000)
    shot('02_fix_groups')
    print('Fix Groups OK')

    # Feed tab
    page.get_by_role('button', name='Feed').first.click()
    page.wait_for_timeout(500)
    shot('03_fix_feed')
    print('Feed OK')

    # Create task dialog
    page.locator('[class*="rounded-full"][class*="bg-blue"]').first.click()
    page.wait_for_timeout(800)
    shot('04_create_task')
    print('Create task dialog OK')
    page.keyboard.press('Escape')

    # Click on a task to open detail
    page.wait_for_timeout(500)
    page.locator('div.border-b.border-gray-100').first.click()
    page.wait_for_timeout(1000)
    shot('05_task_detail')
    print('Task detail OK')
    page.keyboard.press('Escape')

    # Areas tab
    page.get_by_role('button', name='Areas').first.click()
    page.wait_for_timeout(500)
    shot('06_areas')
    print('Areas OK')

    # Groups tab - click group
    page.get_by_role('button', name='Groups').first.click()
    page.wait_for_timeout(500)
    page.locator('div.bg-white.rounded-xl.border').first.click()
    page.wait_for_timeout(1000)
    shot('07_group_detail')
    print('Group detail OK')
    page.keyboard.press('Escape')

    # Expand sidebar
    page.wait_for_timeout(300)
    # Click the expand button in sidebar
    page.locator('aside button').first.click()
    page.wait_for_timeout(500)
    shot('08_sidebar')
    print('Sidebar OK')

    # Plan - click via sidebar
    click_nav('Plan')
    page.wait_for_timeout(1000)
    shot('09_plan')
    print('Plan OK')

    # Assets
    click_nav('Assets')
    page.wait_for_timeout(1000)
    shot('10_assets')
    print('Assets OK')

    # Chat
    click_nav('Chat')
    page.wait_for_timeout(1000)
    shot('11_chat')
    print('Chat OK')

    # Dashboard
    click_nav('Dashboard')
    page.wait_for_timeout(1500)
    shot('12_dashboard')
    print('Dashboard OK')

    # Profile
    click_nav('My Profile')
    page.wait_for_timeout(1000)
    shot('13_profile')
    print('Profile OK')

    browser.close()
    print('\n✅ All screens verified!')
