import sys
import time
from selenium import webdriver
from lxml import html


class scraper():
    def __init__(self):
        self.driver = webdriver.Chrome()  # chrome_options=options

    # 2 step verification otp insertion manually
    def check_mfa_and_manual_otp(self):
        # detect if its asking for otp or not and if its asking then ask here for the otp or just check if its logged in or not Check for the presence of the <h1> tag with the specific text
        try:
            if self.driver.find_element("xpath", '//div[@class="a-box-inner"]/h1').text in "Two-Step Verification":
                print("The <h1> tag with text 'Two-Step Verification' was found.")

                # Prompt user by input with 3 wrong attempts of manual otp insertion
                for i in range(1, 4):
                    user_input = input("Enter the OTP of Two step verification : ")
                    print(f"User input received: {user_input}")

                    # id="auth-signin-button"
                    time.sleep(1)
                    otp_insertion = self.driver.find_element("id", "auth-mfa-otpcode").send_keys(
                        user_input)  # passing password
                    time.sleep(1)

                    mfa_login = self.driver.find_element("xpath",
                                                         '//*[@id="auth-signin-button"]').click()  # clicking on sign in button
                    time.sleep(2)

                    # verify_mfa
                    try:
                        navbar_text = self.driver.find_element("xpath",
                                                               '//div[@class="a-box-inner a-alert-container"]/h4').text
                        if 'There was a problem' == navbar_text:
                            print(f'wrong otp , please provide correct OTP , you have {abs(i - 4)} attempts left')
                            continue
                        else:
                            break
                    except:
                        pass
                        break

                # //div[@class="a-box-inner a-alert-container"]/h4
                # There was a problem
        except Exception as e:
            print("The <h1> tag with text 'Two-Step Verification' was not found.")
            print(f"Exception: {e}")

    # order details parsing function
    def get_product_ordered_details(self):
        try:
            response = html.fromstring(self.driver.page_source)
            data_dicts = []
            # in amazon there is pagination of 10 listing per page for order details so i havent applied limit of 10
            selector = response.xpath('//div[@class="order-card js-order-card"]')
            for each_selector in selector:
                dict1 = {}

                # PRICE
                # try:dict1['price'] = each_selector.xpath('.//span[contains(text(), "Total")]/ancestor::div[1]/following-sibling::div[1]/span')[0].text.replace('\n', ' ').replace('  ', ' ').strip()
                try:
                    dict1['price'] = each_selector.xpath(
                        './/div[@class="a-column a-span2"]//span[@class="a-size-base a-color-secondary"]')[
                        0].text.replace('\n', ' ').replace('  ', ' ').strip()
                except:
                    dict1['price'] = ''

                if not dict1['price']:  # if empty or HtmlElement
                    try:
                        # dict1['price'] = each_selector.xpath('.//span[@class="currencyINRFallback"]/../')
                        dict1['price'] = \
                        each_selector.xpath('.//span[@style="text-decoration: inherit; white-space: nowrap;"]')[
                            0].text_content().strip()
                        # if dict1['price'] : '₹'+dict1['price']
                    except:
                        dict1['price'] = ''

                # PRODUCT
                try:
                    dict1['link_to_product'] = each_selector.xpath(
                        './/div[@class="a-fixed-left-grid-inner"]//div[@class="a-row"]//a[@class="a-link-normal"]/@href')[
                        0]
                except:
                    dict1['link_to_product'] = ''

                # NAME
                try:
                    dict1['name'] = each_selector.xpath(
                        './/div[@class="a-fixed-left-grid-inner"]//div[@class="a-row"]//a[@class="a-link-normal"]/div/text()')[
                        0].replace('\n', ' ').replace('  ', ' ').strip()
                except:
                    dict1['name'] = ''

                if not dict1['name']:
                    try:
                        dict1['name'] = each_selector.xpath(
                            './/div[@class="a-fixed-left-grid-inner"]//div[@class="a-row"]//a[@class="a-link-normal"]')[
                            0].text.replace('\n', ' ').replace('  ', ' ').strip()
                    except:
                        dict1['name'] = ''

                if any(dict1.values()):
                    if dict1['link_to_product']: dict1['link_to_product'] = "https://www.amazon.in" + dict1[
                        'link_to_product']
                    data_dicts.append(dict1)
            return data_dicts
        except Exception as e:
            print(e, 'No product order data')
            return data_dicts

    # verification that we are logged in or not
    def verify_login(self):
        verification_login = False
        # verify logged in or not

        navbar_text = self.driver.find_element("xpath", '//a[@id="nav-link-accountList"]/div/span').text
        if 'Hello, sign in' == navbar_text:
            print('login failed')

        elif 'Hello, ' in navbar_text:
            verification_login = True
            print(f'logged in welcome - {navbar_text.split(",")[-1]}')

        else:
            print('Login failed ')
        return verification_login

    def login(self):
        # login page url
        self.driver.get(
            'https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0')
        time.sleep(2)

        # user name insert with 3 wrong attempts
        for i in range(1, 4):

            email_input = self.driver.find_element("id", "ap_email").send_keys(
                input("Enter the EMAIL OR MOBILE_NUMBER of amazon.in account :"))  # passing user name
            time.sleep(1)
            continue_button = self.driver.find_element("xpath",
                                                       '//*[@id="continue"]').click()  # clicking on continue button
            time.sleep(1)

            if "Enter the characters you see below" in self.driver.page_source:
                print(" CAPTCHA FOUND manually insert it , you have 7 seconds only")
                time.sleep(7)
                break
            elif "We cannot find an account with that mobile number" in self.driver.page_source and "ap_change_login_claim" not in self.driver.page_source:
                print(f"NO ACCOUNT ON THAT USER NAME , you have {abs(4 - 1 - i)} attempts left')")
                self.driver.find_element("id", "ap_email").clear()


            elif "ap_change_login_claim" in self.driver.page_source:  # go ahead
                break
            else:
                print('some other errors please check browser')
        else:
            print('suspending the crawler as ')
            # HANDLE ACCOUNT NOT FOUND

        # password insert with 3 wrong attempts
        for i in range(1, 4):

            password_input = self.driver.find_element("id", "ap_password").send_keys(
                input("Enter the PASSWORD of amazon.in account :"))  # passing password
            time.sleep(1)
            sign_in_button = self.driver.find_element("xpath",
                                                      '//*[@id="signInSubmit"]').click()  # clicking on sign in button
            time.sleep(2)

            if "Enter the characters you see below" in self.driver.page_source:
                print(" CAPTCHA FOUND manually insert it , you have 7 seconds only")
                time.sleep(7)
                break
            elif "Your password is incorrect" in self.driver.page_source:
                print(f"PASSWORD IS INCORRECT , you have {abs(4 - 1 - i)} attempts left')")
                self.driver.find_element("id", "ap_password").clear()

            elif "Two-Step Verification" in self.driver.page_source:  # go ahead
                break

            elif self.verify_login(self.driver):  # go ahead
                break

            else:
                print('some other errors please check browser')
        else:
            print('suspending the crawler ')
        # HANDLE WRONG PASSWORD

        # if mfa is there and then insert otp with 3 wrong attempts
        self.check_mfa_and_manual_otp()

        # verifying login
        verification_login = self.verify_login()

        # if user is logged in and then hiting order page url with this years order and getting required info
        if verification_login:

            # hit the order page and get the last order details three fields
            self.driver.get(
                'https://www.amazon.in/your-orders/orders?timeFilter=year-2024&ref_=ppx_yo2ov_dt_b_filter_all_y2024')
            time.sleep(3)

            # parse the details
            try:
                data = self.get_product_ordered_details()
                print('Last 10 ORDER Details', data)
            except Exception as e:
                print('No product ordered')


        else:
            print('login try failed .. try again')
            sys.exit(1)


if __name__ == '__main__':
    obj1 = scraper()
    obj1.login()

