import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        await page.goto("http://localhost:5173/")
        await asyncio.sleep(2)

        # 1. Click Import PCF using generic text or role
        print("Clicking Import PCF...")
        await page.click("text=/Import PCF/i")

        # 2. Select BM1_Gaps_Overlaps.pcf from dialog
        file_input = page.locator("input[type='file']")
        await file_input.set_input_files("tests/benchmarks/BM1_Gaps_Overlaps.pcf")

        # Wait a bit for processing
        await asyncio.sleep(2)

        # Go to Stage 2
        print("Go to Stage 2...")
        await page.click("text=/Stage 2/i")
        await asyncio.sleep(1)

        # Click Pull Data from Stage 1
        print("Pulling from Stage 1...")
        await page.click("button:has-text('Pull Data from Stage 1')")
        await asyncio.sleep(1)

        # The prompt might have a Yes/No modal: "Pull Data from Stage 1? This will overwrite..."
        try:
             await page.click("button:has-text('Yes')", timeout=2000)
             await asyncio.sleep(1)
        except Exception as e:
             pass

        # Close modal if exists (like a success modal)
        try:
            await page.click("text=/Close/i", timeout=1000)
        except:
            pass

        await asyncio.sleep(1)

        # Try to scroll the table to the right
        await page.evaluate("() => { const table = document.querySelector('.overflow-x-auto'); if(table) table.scrollLeft = 2000; }")

        # Click Run Phase 1 Validator
        print("Clicking Run Phase 1 Validator...")
        await page.click("button:has-text('Run Phase 1 Validator')")
        await asyncio.sleep(2)

        # Handle the Engine Selection modal
        try:
            print("Clicking Run Engine in modal...")
            await page.click("button:has-text('Run Engine')", timeout=2000)
            await asyncio.sleep(2)
        except Exception as e:
            print("No Run Engine modal found.")
            pass

        # Click Smart Fix
        print("Clicking Smart Fix...")
        try:
            await page.click("button:has-text('Smart Fix')", timeout=5000)
            await asyncio.sleep(2)
        except Exception as e:
            print("Failed to click Smart Fix. Taking screenshot...")
            await page.screenshot(path="/home/jules/verification/debug_smartfix.png")
            return

        # Scroll right again
        await page.evaluate("() => { const table = document.querySelector('.overflow-x-auto'); if(table) table.scrollLeft = 2000; }")

        await page.screenshot(path="/home/jules/verification/pass1_initial.png")
        print("Captured Pass 1 state.")

        # Find reject button and click it
        try:
            reject_btn = page.locator("button:has-text('✗ Reject')").first
            await reject_btn.click(timeout=2000)
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/pass1_rejected.png")
            print("Captured Pass 1 rejected state.")
        except Exception as e:
            print("No reject button found:", e)

        try:
            approve_btn = page.locator("button:has-text('✓ Approve')").first
            await approve_btn.click(timeout=2000)
            await asyncio.sleep(1)
        except Exception as e:
            print("No approve button found:", e)

        await page.click("button:has-text('Apply Fixes')")
        await asyncio.sleep(1)

        try:
            await page.click("button:has-text('Confirm Apply')", timeout=2000)
        except:
            try:
                 await page.click("button:has-text('Apply')", timeout=1000)
            except:
                 pass

        await asyncio.sleep(2)

        # Now try running Pass 2
        print("Clicking Run Second Pass...")
        await page.click("button:has-text('Run Second Pass')")
        await asyncio.sleep(2)

        # Scroll right again
        await page.evaluate("() => { const table = document.querySelector('.overflow-x-auto'); if(table) table.scrollLeft = 2000; }")

        await page.screenshot(path="/home/jules/verification/pass2_results.png")
        print("Captured Pass 2 state.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
