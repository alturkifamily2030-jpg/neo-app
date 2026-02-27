from playwright.sync_api import sync_playwright
import os

SHOTS = '/home/ubuntu/neo-app/verify_shots'
os.makedirs(SHOTS, exist_ok=True)

def close_modals(page):
    try:
        page.locator('[class*="fixed inset-0"]').first
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)
    except: pass
    # Also try clicking outside
    page.mouse.click(10, 10)
    page.wait_for_timeout(300)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    def shot(name):
        page.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
        print(f'  [✓] {name}.png')

    def click_sidebar(label):
        for sel in [f'aside a:has-text("{label}")', f'aside button:has-text("{label}")',
                    f'aside span:has-text("{label}")', f'nav *:has-text("{label}")']:
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
    print('Login page OK')

    page.fill('input[type=email]', 'test@neo.com')
    page.fill('input[type=password]', 'password123')
    page.get_by_role('button', name='Login').click()
    page.wait_for_timeout(2000)
    shot('02_fix_groups')
    print('Fix Groups OK')

    # Feed tab + task list
    page.get_by_role('button', name='Feed').first.click()
    page.wait_for_timeout(800)
    shot('03_fix_feed')
    print('Feed OK')

    # Click a feed task item (using the px-4 py-3 container)
    task_items = page.locator('.flex.items-center.gap-4.px-4').all()
    if task_items:
        task_items[0].click()
        page.wait_for_timeout(1000)
        shot('04_task_detail')
        print('Task detail OK')
        # Close via X button
        try:
            page.locator('button:has(.lucide-x)').first.click()
            page.wait_for_timeout(500)
        except:
            page.keyboard.press('Escape')
            page.wait_for_timeout(500)

    # Create task dialog
    page.locator('button.rounded-full.bg-blue-600').first.click()
    page.wait_for_timeout(800)
    shot('05_create_task')
    print('Create task dialog OK')
    # Close modal
    try:
        page.locator('button:has(.lucide-x)').first.click()
        page.wait_for_timeout(500)
    except:
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # Areas tab
    page.get_by_role('button', name='Areas').first.click()
    page.wait_for_timeout(800)
    shot('06_areas')
    print('Areas OK')

    # Groups + Group detail
    page.get_by_role('button', name='Groups').first.click()
    page.wait_for_timeout(800)
    group_cards = page.locator('div.bg-white.rounded-xl.border.border-gray-200.cursor-pointer').all()
    if group_cards:
        group_cards[0].click()
        page.wait_for_timeout(1000)
        shot('07_group_detail')
        print('Group detail OK')
        try:
            page.locator('button:has(.lucide-x)').first.click()
        except:
            page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # Expand sidebar
    page.locator('aside button.p-1.rounded.hover\\:bg-gray-100').first.click()
    page.wait_for_timeout(500)
    shot('08_sidebar_expanded')
    print('Sidebar expanded OK')

    # Navigate via sidebar links
    click_sidebar('Plan')
    page.wait_for_timeout(1500)
    shot('09_plan')
    print('Plan OK')

    click_sidebar('Assets')
    page.wait_for_timeout(1000)
    shot('10_assets')
    print('Assets OK')

    click_sidebar('Chat')
    page.wait_for_timeout(1000)
    shot('11_chat')
    print('Chat OK')

    click_sidebar('Dashboard')
    page.wait_for_timeout(2000)
    shot('12_dashboard')
    print('Dashboard OK')

    click_sidebar('My Profile')
    page.wait_for_timeout(1000)
    shot('13_profile')
    print('Profile OK')

    browser.close()
    print('\n✅ All verified!')
