// check is login github
function checkLoginStatus() {
    return new Promise((resolve, reject) => {
      chrome.cookies.get({ url: 'https://github.com', name: 'user_session' }, (cookie) => {
        if (cookie) {
          resolve(true); // login
        } else {
          resolve(false); // unlogin
        }
      });
    });
  }

  // get username from cookies
function getUserFromCookie() {
    return new Promise((resolve, reject) => {
      chrome.cookies.get({ url: 'https://github.com', name: 'dotcom_user' }, (cookie) => {
        if (cookie) {
            resolve(cookie.value);
        }
      });
    });
  }

function getRepoStarlists(url, callback) {
    chrome.cookies.getAll({ domain: 'github.com' }, (cookies) => {
        const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

        fetch(url + '/lists', {
        headers: { 'Cookie': cookieHeader }
        })
        .then(response => response.text())
        .then(html => {
            const checkboxes = new DOMParser().parseFromString(html, 'text/html')
            .querySelectorAll('.js-user-list-menu-form .form-checkbox .d-flex input[type="checkbox"]:checked');

            const results = Array.from(checkboxes).map(checkbox => {
            const text = checkbox ? checkbox.parentElement.querySelector('.Truncate .Truncate-text') : null;
            return text ? text.textContent : null;
            });

            callback(null, results);
        })
        .catch(error => {
            callback(error);
        });
    });
}

  
  