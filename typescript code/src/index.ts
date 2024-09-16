import puppeteer, { Browser, Page } from 'puppeteer';
import * as readlineSync from 'readline-sync';

class Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await puppeteer.launch({ headless: false }); // Ensure not headless
    this.page = await this.browser.newPage();
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkMfaAndManualOtp() {
    if (!this.page) return;

    try {
      await this.page.waitForSelector('div.a-box-inner h1', { visible: true });
      const headerText = await this.page.$eval('div.a-box-inner h1', el => el.textContent || '');

      if (headerText.includes('Two-Step Verification')) {
        console.log("The <h1> tag with text 'Two-Step Verification' was found.");

        for (let i = 1; i <= 3; i++) {
          console.log('Prompting for OTP input...');
          const userInput = readlineSync.question("Enter the OTP of Two step verification: ");
          if (!userInput) return;

          await this.page.type('#auth-mfa-otpcode', userInput);
          await this.page.click('#auth-signin-button');
          await this.sleep(2000);  // Replacing waitForTimeout with sleep

          try {
            const navbarText = await this.page.$eval('div.a-box-inner.a-alert-container h4', el => el.textContent || '');
            if (navbarText === 'There was a problem') {
              console.log(`Wrong OTP. Please provide the correct OTP. You have ${4 - i} attempts left.`);
              continue;
            } else {
              break;
            }
          } catch {
            break;
          }
        }
      }
    } catch (e) {
      console.error("The <h1> tag with text 'Two-Step Verification' was not found.");
      console.error(`Exception: ${e}`);
    }
  }

  async getProductOrderedDetails() {
    if (!this.page) return [];

    try {
      const dataDicts: any[] = [];
      const selectors = await this.page.$$('.order-card.js-order-card');
      for (const eachSelector of selectors) {
        const dict1: any = {};

        // PRICE
        try {
          dict1['price'] = await this.page.evaluate(el => {
            const priceElement = el.querySelector('.a-column.a-span2 .a-size-base.a-color-secondary') as HTMLElement;
            return priceElement ? priceElement.textContent?.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim() : '';
          }, eachSelector);
        } catch {
          dict1['price'] = '';
        }

        if (!dict1['price']) {
          try {
            dict1['price'] = await this.page.evaluate(el => {
              const priceElement = el.querySelector('span[style="text-decoration: inherit; white-space: nowrap;"]');
              return priceElement ? priceElement.textContent?.trim() : '';
            }, eachSelector);
          } catch {
            dict1['price'] = '';
          }
        }

        // PRODUCT
        try {
          dict1['link_to_product'] = await this.page.evaluate(el => {
            const linkElement = el.querySelector('a.a-link-normal');
            return linkElement ? linkElement.getAttribute('href') : '';
          }, eachSelector);
        } catch {
          dict1['link_to_product'] = '';
        }

        // NAME
        try {
          dict1['name'] = await this.page.evaluate(el => {
            const nameElement = el.querySelector('a.a-link-normal > div');
            return nameElement ? nameElement.textContent?.replace('\n', ' ').replace('  ', ' ').trim() : '';
          }, eachSelector);
        } catch {
          dict1['name'] = '';
        }

        if (!dict1['name']) {
          try {
            dict1['name'] = await this.page.evaluate(el => {
              const nameElement = el.querySelector('a.a-link-normal');
              return nameElement ? nameElement.textContent?.replace('\n', ' ').replace('  ', ' ').trim() : '';
            }, eachSelector);
          } catch {
            dict1['name'] = '';
          }
        }

        if (Object.values(dict1).some(value => value)) {
          if (dict1['link_to_product']) dict1['link_to_product'] = `https://www.amazon.in${dict1['link_to_product']}`;
          dataDicts.push(dict1);
        }
      }
      return dataDicts;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async verifyLogin() {
    if (!this.page) return false;

    let verificationLogin = false;
    const navbarText = await this.page.$eval('#nav-link-accountList > div > span', el => el.textContent || '');

    if (navbarText === 'Hello, sign in') {
      console.log('Login failed');
    } else if (navbarText.includes('Hello, ')) {
      verificationLogin = true;
      console.log(`Logged in. Welcome - ${navbarText.split(',').pop()}`);
    } else {
      console.log('Login failed');
    }

    return verificationLogin;
  }

  async login() {
    if (!this.page || !this.browser) return;

    await this.page.goto('https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');
    await this.sleep(2000);  // Replacing waitForTimeout with sleep

    for (let i = 1; i <= 3; i++) {
      console.log('Prompting for email input...');
      const emailInput = readlineSync.question("Enter the EMAIL OR MOBILE_NUMBER of amazon.in account: ");
      if (!emailInput) return;

      await this.page.type('#ap_email', emailInput);
      await this.page.click('#continue');
      await this.sleep(1000);  // Replacing waitForTimeout with sleep

      const pageContent = await this.page.content();
      if (pageContent.includes("Enter the characters you see below")) {
        console.log("CAPTCHA FOUND. Manually insert it. You have 7 seconds only.");
        await this.sleep(7000);  // Replacing waitForTimeout with sleep
        break;
      } else if (pageContent.includes("We cannot find an account with that mobile number") && !pageContent.includes("ap_change_login_claim")) {
        console.log(`No account with that username. You have ${4 - i} attempts left.`);
        await this.page.click('#ap_email').then(() => this.page.keyboard.press('Backspace'));
      } else if (pageContent.includes("ap_change_login_claim")) {
        break;
      } else {
        console.log('Some other errors. Please check browser.');
      }
    }

    for (let i = 1; i <= 3; i++) {
      console.log('Prompting for password input...');
      const passwordInput = readlineSync.question("Enter the PASSWORD of amazon.in account: ");
      if (!passwordInput) return;

      await this.page.type('#ap_password', passwordInput);
      await this.page.click('#signInSubmit');
      await this.sleep(2000);  // Replacing waitForTimeout with sleep

      const pageContent = await this.page.content();
      if (pageContent.includes("Enter the characters you see below")) {
        console.log("CAPTCHA FOUND. Manually insert it. You have 7 seconds only.");
        await this.sleep(7000);  // Replacing waitForTimeout with sleep
        break;
      } else if (pageContent.includes("Your password is incorrect")) {
        console.log(`Password is incorrect. You have ${4 - i} attempts left.`);
        await this.page.click('#ap_password').then(() => this.page.keyboard.press('Backspace'));
      } else if (pageContent.includes("Two-Step Verification")) {
        break;
      } else if (await this.verifyLogin()) {
        break;
      } else {
        console.log('Some other errors. Please check browser.');
      }
    }

    await this.checkMfaAndManualOtp();

    const verificationLogin = await this.verifyLogin();
    if (verificationLogin) {
      await this.page.goto('https://www.amazon.in/your-orders/orders?timeFilter=year-2024&ref_=ppx_yo2ov_dt_b_filter_all_y2024');
      await this.sleep(3000);  // Replacing waitForTimeout with sleep

      const data = await this.getProductOrderedDetails();
      console.log('Last 10 ORDER Details:', data);
    } else {
      console.log('Login attempt failed. Try again.');
      await this.browser.close();
      process.exit(1);
    }
  }
}

(async () => {
  const scraper = new Scraper();
  await scraper.init();
  await scraper.login();
})();
