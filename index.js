const request = require('request');

function makeHeaders(o) {
  return Object.assign({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-us,en',
    'Accept-Charset': 'iso-8859-1,*,utf-8',
    'Host': 'account.enmasse.com',
    'Origin': 'https://account.enmasse.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.21 (KHTML, like Gecko) Chrome/19.0.1046.0 Safari/535.21',
  }, o);
}

class webClient {
  constructor(email, pass, ioBlackBoxToken) {
    this.email = email;
    this.pass = pass;
    this.ioBlackBoxToken = ioBlackBoxToken;
    this.ready = -1;
    this.request = request.defaults({
      baseUrl: 'https://account.enmasse.com',
      headers: makeHeaders(),
      jar: true,
      strictSSL: false,
      timeout: 20 * 1000,
    });
  }

  getLogin(callback) {
    return this._signin(() => {
      if (this.ready !== 1) return;

      this.request('/launcher/1', (err, res, body) => {
        const token = body.match(/meta content="(.+?)" name="csrf-token"/i);
        if (!token) {
          console.log('Failed to get CSRF token');
          return;
        }

        console.log('Retrieving auth ticket and server info')
        this.request({
          url: '/launcher/1/account_server_info?attach_auth_ticket=1',
          headers: makeHeaders({
            'Referer': 'https://account.enmasse.com/launcher/1/signin',
            'X-CSRF-Token': token[1],
            'X-Requested-With': 'XMLHttpRequest',
          }),
        }, (err, res, body) => {
          if (err) {
            console.log('Error: ');
            console.log(err);
            return callback('Failed to get account server info');
          }

          if (res.statusCode !== 200) {
            console.log(res.body);
            return callback('Expected status code to be 200, was ' + res.statusCode);
          }

          let data;
          try {
            data = JSON.parse(body);
          } catch (e) {
            console.log('Error: ');
            console.log(body);
            console.log(e);
            return callback('JSON parse error');
          }

          if (data['result-code'] !== 200) {
            return callback('Expected status code to be 200, was ' + data['result-code']);
          }

          console.log(`Ticket retrieved (${data.master_account_name}:${data.ticket})`);

          callback(null, {
            name: data.master_account_name,
            ticket: data.ticket,
          });
        });
      });
    });
  }

  /* ********
   * signin()
   * ********
   * Pulls CSRF token.
   */
  _signin(callback) {
    if (this.ready === 1) {
      callback();
      return true;
    } else if (this.ready === 0) {
      return;
    } else {
      this.ready = 0;
    }

    console.log('Getting CSRF token');

    this.request('/launcher/1/signin', (err, res, body) => {
      if (err) {
        console.log('Error: ');
        console.log(err);
        return;
      }

      const token = body.match(/meta content="(.+?)" name="csrf-token"/i);
      if (!token) {
        console.log('Failed to get CSRF token');
        return;
      }

      console.log('Got CSRF token: ' + token[1]);

      this._authenticate(callback, {
        'authenticity_token': token[1],
        'user[client_time]': Date(Date.UTC()),
        'user[io_black_box]': this.ioBlackBoxToken,
        'game_id' : 1,
        'user[email]': this.email,
        'user[password]': this.pass,
      });
    });
  };

  /* **************
   * authenticate()
   * **************
   * Submits login form and follows the redirect.
   */
  _authenticate(callback, params) {
    console.log('Authenticating account: ' + params['user[email]']);

    this.request.post({
      url: '/launcher/1/authenticate',
      headers: makeHeaders({
        'Referer': 'https://account.enmasse.com/launcher/1/signin',
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      form: params,
    }, (err, res, body) => {
      if (err) {
        console.log(err);
        return;
      }

      if (res.statusCode !== 302) {
        console.log('Failed to authenticate');
        return;
      }

      this.ready = 1;
      callback();
    });
  };
}

module.exports = webClient;
