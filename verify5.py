from playwright.sync_api import sync_playwright
import os

SHOTS = '/home/ubuntu/neo-app/verify_shots'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    def shot(name):
        page.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
        print(f'  [✓] {name}.png')

    def close_modal():
        # Try clicking the close X button inside modal
        try:
            close_btns = page.locator('.fixed.inset-0 button').all()
            for btn in close_btns:
                try:
                    if btn.is_visible(timeout=500):
                        btn.click()
                        page.wait_for_timeout(500)
                        return
                except: pass
        except: pass
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # Login
    page.goto('http://localhost:5173/', timeout=15000)
    page.wait_for_timeout(2000)
    shot('01_login')
    print('Login OK')

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

    # Task detail - click first task
    page.locator('.flex.items-center.gap-4.px-4.py-3').first.click()
    page.wait_for_timeout(800)
    shot('04_task_detail')
    print('Task detail OK')
    close_modal()

    # Areas tab
    page.get_by_role('button', name='Areas').first.click()
    page.wait_for_timeout(600)
    shot('05_areas')
    print('Areas OK')

    # Groups tab
    page.get_by_role('button', name='Groups').first.click()
    page.wait_for_timeout(600)

    # Group detail
    page.locator('div.bg-white.rounded-xl.border.cursor-pointer').first.click()
    page.wait_for_timeout(800)
    shot('06_group_detail')
    close_modal()
    print('Group detail OK')

    # Expand sidebar
    sidebar_btns = page.locator('aside button').all()
    for btn in sidebar_btns:
        try:
            if btn.is_visible(timeout=300):
                btn.click()
                break
        except: pass
    page.wait_for_timeout(500)
    shot('07_sidebar_expanded')
    print('Sidebar expanded OK')

    # Navigate Plan
    page.locator('aside a[href="/plan"]').click()
    page.wait_for_timeout(1500)
    shot('08_plan')
    print('Plan OK')

    # Create plan task dialog
    page.get_by_role('button', name='Add Task').click()
    page.wait_for_timeout(800)
    shot('09_create_plan_task')
    close_modal()
    print('Create Plan task OK')

    # Assets
    page.locator('aside a[href="/assets"]').click()
    page.wait_for_timeout(1000)
    shot('10_assets')
    print('Assets OK')

    # Chat
    page.locator('aside a[href="/chat"]').click()
    page.wait_for_timeout(1000)
    shot('11_chat')
    print('Chat OK')

    # Dashboard
    page.locator('aside a[href="/dashboard"]').click()
    page.wait_for_timeout(2000)
    shot('12_dashboard')
    print('Dashboard OK')

    # Profile
    page.locator('aside a[href="/profile"]').click()
    page.wait_for_timeout(1000)
    shot('13_profile')
    print('Profile OK')

    browser.close()
    print('\n✅ All screens captured!')
