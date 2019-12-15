# tera-auth-ticket

If you know what this does, then you don't need to read this :^).

This module simulates logging onto an NA TERA account (through the NA publisher's web portal) to fetch an authentication ticket, to be used for a clientless login.

Example:

```
// clientless-or-whatever-you-wanna-name-this.js

const webClient = require('tera-auth-ticket');
const web = new webClient(email, password, iesnareToken); 
doLogin();
async function doLogin() 
{
  await web.getLogin((err, data) => {
    if (err){
      /* the request has failed, and may be because:
         - your internet connection is garbage (ENOTFOUND, ECONNABORTED, ECONNRESET, etc), or 
         - the authentication server's internet connection is garbage
         - you submitted incorrect credentials
         - you are banned.
         - you are IP blocked/banned (in which case, your account will also be banned in short order :^)).
       */
    }
    else{
      // start up main routine of connecting to server. see FakeClient.js in Tera-Proxy-Game-or-whatever-Caali-has-renamed-it-to in toolbox/proxy repos. 
      // If Caali or Pinkie deletes that file, then just browse to an older commit or browser to one of the many, many, many forks floating around on Github.
    }
  });
  // Maybe you want to be fancy by integrating login re-attempt logic here? :^)
  
 }

```

For your iesnare token (aka "ioBlackBoxToken"), you can either copy it directly from your registry (e.g. SNPR1), or you can spoof a random one.

