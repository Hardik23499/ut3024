"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const readlineSync = require("readline-sync");
class Scraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.default.launch({ headless: false }); // Ensure not headless
            this.page = yield this.browser.newPage();
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    checkMfaAndManualOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                return;
            try {
                yield this.page.waitForSelector('div.a-box-inner h1', { visible: true });
                const headerText = yield this.page.$eval('div.a-box-inner h1', el => el.textContent || '');
                if (headerText.includes('Two-Step Verification')) {
                    console.log("The <h1> tag with text 'Two-Step Verification' was found.");
                    for (let i = 1; i <= 3; i++) {
                        console.log('Prompting for OTP input...');
                        const userInput = readlineSync.question("Enter the OTP of Two step verification: ");
                        if (!userInput)
                            return;
                        yield this.page.type('#auth-mfa-otpcode', userInput);
                        yield this.page.click('#auth-signin-button');
                        yield this.sleep(2000); // Replacing waitForTimeout with sleep
                        try {
                            const navbarText = yield this.page.$eval('div.a-box-inner.a-alert-container h4', el => el.textContent || '');
                            if (navbarText === 'There was a problem') {
                                console.log(`Wrong OTP. Please provide the correct OTP. You have ${4 - i} attempts left.`);
                                continue;
                            }
                            else {
                                break;
                            }
                        }
                        catch (_a) {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.error("The <h1> tag with text 'Two-Step Verification' was not found.");
                console.error(`Exception: ${e}`);
            }
        });
    }
    getProductOrderedDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                return [];
            try {
                const dataDicts = [];
                const selectors = yield this.page.$$('.order-card.js-order-card');
                for (const eachSelector of selectors) {
                    const dict1 = {};
                    // PRICE
                    try {
                        dict1['price'] = yield this.page.evaluate(el => {
                            var _a;
                            const priceElement = el.querySelector('.a-column.a-span2 .a-size-base.a-color-secondary');
                            return priceElement ? (_a = priceElement.textContent) === null || _a === void 0 ? void 0 : _a.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim() : '';
                        }, eachSelector);
                    }
                    catch (_a) {
                        dict1['price'] = '';
                    }
                    if (!dict1['price']) {
                        try {
                            dict1['price'] = yield this.page.evaluate(el => {
                                var _a;
                                const priceElement = el.querySelector('span[style="text-decoration: inherit; white-space: nowrap;"]');
                                return priceElement ? (_a = priceElement.textContent) === null || _a === void 0 ? void 0 : _a.trim() : '';
                            }, eachSelector);
                        }
                        catch (_b) {
                            dict1['price'] = '';
                        }
                    }
                    // PRODUCT
                    try {
                        dict1['link_to_product'] = yield this.page.evaluate(el => {
                            const linkElement = el.querySelector('a.a-link-normal');
                            return linkElement ? linkElement.getAttribute('href') : '';
                        }, eachSelector);
                    }
                    catch (_c) {
                        dict1['link_to_product'] = '';
                    }
                    // NAME
                    try {
                        dict1['name'] = yield this.page.evaluate(el => {
                            var _a;
                            const nameElement = el.querySelector('a.a-link-normal > div');
                            return nameElement ? (_a = nameElement.textContent) === null || _a === void 0 ? void 0 : _a.replace('\n', ' ').replace('  ', ' ').trim() : '';
                        }, eachSelector);
                    }
                    catch (_d) {
                        dict1['name'] = '';
                    }
                    if (!dict1['name']) {
                        try {
                            dict1['name'] = yield this.page.evaluate(el => {
                                var _a;
                                const nameElement = el.querySelector('a.a-link-normal');
                                return nameElement ? (_a = nameElement.textContent) === null || _a === void 0 ? void 0 : _a.replace('\n', ' ').replace('  ', ' ').trim() : '';
                            }, eachSelector);
                        }
                        catch (_e) {
                            dict1['name'] = '';
                        }
                    }
                    if (Object.values(dict1).some(value => value)) {
                        if (dict1['link_to_product'])
                            dict1['link_to_product'] = `https://www.amazon.in${dict1['link_to_product']}`;
                        dataDicts.push(dict1);
                    }
                }
                return dataDicts;
            }
            catch (e) {
                console.error(e);
                return [];
            }
        });
    }
    verifyLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                return false;
            let verificationLogin = false;
            const navbarText = yield this.page.$eval('#nav-link-accountList > div > span', el => el.textContent || '');
            if (navbarText === 'Hello, sign in') {
                console.log('Login failed');
            }
            else if (navbarText.includes('Hello, ')) {
                verificationLogin = true;
                console.log(`Logged in. Welcome - ${navbarText.split(',').pop()}`);
            }
            else {
                console.log('Login failed');
            }
            return verificationLogin;
        });
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page || !this.browser)
                return;
            yield this.page.goto('https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');
            yield this.sleep(2000); // Replacing waitForTimeout with sleep
            for (let i = 1; i <= 3; i++) {
                console.log('Prompting for email input...');
                const emailInput = readlineSync.question("Enter the EMAIL OR MOBILE_NUMBER of amazon.in account: ");
                if (!emailInput)
                    return;
                yield this.page.type('#ap_email', emailInput);
                yield this.page.click('#continue');
                yield this.sleep(1000); // Replacing waitForTimeout with sleep
                const pageContent = yield this.page.content();
                if (pageContent.includes("Enter the characters you see below")) {
                    console.log("CAPTCHA FOUND. Manually insert it. You have 7 seconds only.");
                    yield this.sleep(7000); // Replacing waitForTimeout with sleep
                    break;
                }
                else if (pageContent.includes("We cannot find an account with that mobile number") && !pageContent.includes("ap_change_login_claim")) {
                    console.log(`No account with that username. You have ${4 - i} attempts left.`);
                    yield this.page.click('#ap_email').then(() => this.page.keyboard.press('Backspace'));
                }
                else if (pageContent.includes("ap_change_login_claim")) {
                    break;
                }
                else {
                    console.log('Some other errors. Please check browser.');
                }
            }
            for (let i = 1; i <= 3; i++) {
                console.log('Prompting for password input...');
                const passwordInput = readlineSync.question("Enter the PASSWORD of amazon.in account: ");
                if (!passwordInput)
                    return;
                yield this.page.type('#ap_password', passwordInput);
                yield this.page.click('#signInSubmit');
                yield this.sleep(2000); // Replacing waitForTimeout with sleep
                const pageContent = yield this.page.content();
                if (pageContent.includes("Enter the characters you see below")) {
                    console.log("CAPTCHA FOUND. Manually insert it. You have 7 seconds only.");
                    yield this.sleep(7000); // Replacing waitForTimeout with sleep
                    break;
                }
                else if (pageContent.includes("Your password is incorrect")) {
                    console.log(`Password is incorrect. You have ${4 - i} attempts left.`);
                    yield this.page.click('#ap_password').then(() => this.page.keyboard.press('Backspace'));
                }
                else if (pageContent.includes("Two-Step Verification")) {
                    break;
                }
                else if (yield this.verifyLogin()) {
                    break;
                }
                else {
                    console.log('Some other errors. Please check browser.');
                }
            }
            yield this.checkMfaAndManualOtp();
            const verificationLogin = yield this.verifyLogin();
            if (verificationLogin) {
                yield this.page.goto('https://www.amazon.in/your-orders/orders?timeFilter=year-2024&ref_=ppx_yo2ov_dt_b_filter_all_y2024');
                yield this.sleep(3000); // Replacing waitForTimeout with sleep
                const data = yield this.getProductOrderedDetails();
                console.log('Last 10 ORDER Details:', data);
            }
            else {
                console.log('Login attempt failed. Try again.');
                yield this.browser.close();
                process.exit(1);
            }
        });
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const scraper = new Scraper();
    yield scraper.init();
    yield scraper.login();
}))();
//# sourceMappingURL=index.js.map