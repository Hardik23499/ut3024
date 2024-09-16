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
exports.scrapeLastPurchases = scrapeLastPurchases;
const puppeteer_1 = require("puppeteer");
function scrapeLastPurchases(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        // const browser = await puppeteer.launch({ headless: true });
        const browser = yield puppeteer_1.default.launch({ headless: false, slowMo: 50, devtools: true });
        const page = yield browser.newPage();
        try {
            yield page.goto('https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');
            // Log in
            yield page.type('input[name="username"]', username);
            yield page.type('input[name="password"]', password);
            yield page.click('button[type="submit"]');
            // Wait for navigation after login
            yield page.waitForNavigation();
            // Navigate to the purchase history page
            yield page.goto('https://www.example.com/account/purchases');
            // Scrape the last 10 items
            const purchases = yield page.evaluate(() => Array.from(document.querySelectorAll('.purchase-item')).slice(0, 10).map(item => {
                var _a, _b, _c;
                return ({
                    name: ((_a = item.querySelector('.item-name')) === null || _a === void 0 ? void 0 : _a.textContent) || '',
                    price: ((_b = item.querySelector('.item-price')) === null || _b === void 0 ? void 0 : _b.textContent) || '',
                    link: ((_c = item.querySelector('a')) === null || _c === void 0 ? void 0 : _c.href) || ''
                });
            }));
            return purchases;
        }
        catch (error) {
            throw new Error(`Failed to scrape purchases: ${error.message}`);
        }
        finally {
            yield browser.close();
        }
    });
}
//# sourceMappingURL=scraper.js.map