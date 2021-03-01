---
title: "Rube Goldberg Machines: OpenID Authentication Process"
date: "2021-02-26T12:00:00.000Z"
description: |
  I decided to learn applicable OAuth and OpenID process this past weekend. What I ended up with feels like a strong security mechanism hidden behind a rube goldberg machine of limitations and constraints. 
---

Before I being, I want to clarify that this is by no means a how to article. This is merely a cautionary tale about what you have to look forward to if you decide to implement security code that interfaces with corporations like Google and Facebook. Its not bad, its just not easy and something that you aren't likely to be able to stumble through like so many other technologies on the internet these days.

## Overview

To start off with, I have made zero attempt at reading the OpenID or OAuth standards documentation. I'm just a naiive noobie application developer that wants to use goliaths like Google, Facebook, and Twitter to become authentication providers for my app. With that said, I wanted to describe my new experience with gathering the components and generating the flow that I works with my app architecture and existing technology.

The assumptions for this application are:
- Everything is implemented in Javascript (ES7).
- HTTP (e.g. REST) endpoints are deployed as serverless functions.
- The end user application is based on React Native.
- To simplify the experimentation and development cycle, Expo is used.
- The authentication provider described here is Google.
- All testing here is done on the Android Platform

## Things I Used

A developer workstation with:
- Android Emulator (w/ Expo Client Installed)
- Code Editor (i.e. Visual Studio Code)
- Terminal (i.e. Windows Terminal)

Serverless project with:
- Jose for JWT processing.
- Node ~v14
- Esm module for modern ES7 semantics.
- Tedious for SQL database access.

Accounts for:
- DNS Server (i.e. GoDaddy)
- Serverless Provider (i.e. Azure Functions)
- Authentication Provider (i.e. Google API)
- End User Client Publisher (i.e. Expo)

## Initial Resources

[Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

This link is what I used as my road map to getting access tokens issued from Google. I emphasis *roadmap* because it assumes you know everything it doesn't bother to mention (i.e. it is not a tutorial).

[Authorization Code Flow with Proof Key for Code Exchange (PKCE)](https://auth0.com/docs/flows/authorization-code-flow-with-proof-key-for-code-exchange-pkce)

Although this article from auth0 is covering PKCE, it has a sequence diagram for OpenID flow that I thought was clean and straight forward. (And yet, it doesn't show the *whole picture*).

## The Fundamentals

Applications that want to authenticate with OAuth are not responsible for proxy-ing the end user credentials. Instead, the applications are responsible for referring the end user to the authentication provider (i.e. Google) to request secrets from the end user.

The referral that is sent includes a number of pieces of information, but fundamentally there is:
- The authentication provider. (Google)
- The client referrer. (The App Itself)
- The URL to callback to after authentication. This is usually a URL to an App or a backend web server.

Once the user authenticates themselves via the remote authentication provider service, a callback is made from the provider to the given callback URL with relevant tokens or codes added as arguments to the callback. Hopefully from here you should be able to perform standard command/response patterns and relevant crypto algorithms to authenticate the tokens for application resource access.

Simple, no?

## The Reality

Before you can make your first request to Google, you'll need to register your "client". This basically means that you need to:
- Know the type of flow you intend to use with your client.
- Know the callback URLs you plan to provide.
- Know the source domains of the referral.
- Verify ownership of referral domain.
- Configure consent screen URLs to your Privacy Policies and Terms of Service for your application.

In summary, before you can even begin to build and test a client authentication with a client identity, you need to pretty much have a complete architectural design with implementation specific details. *Tangent: Are security constraints forcing waterfall methodologies?*

### Google API Registration

In any case, I did the following:
- Verified ownership of my `myapp.app` domain by inserting a TXT entry given by Google in the name server.
- Added a `auth.myapp.app` subdomain to verified domains.
- Chose `Web Application` authentication flow.
- Configured consent screen with fake URLs:
  * Privacy Policy: `https://auth.myapp.app/privacy-policy`
  * Terms Of Service: `https://auth.myapp.app/tos`
- Added redirect_uri (i.e. callback) URL: `https://auth.myapp.app/` - This is the root path into a subdomain to be specifically provisioned for authentication related functionality.
- Added source URL: `https://myapp.azurewebsites.net/` - This is a typical looking endpoint for an Azure Function App.
- Registered for `email` scope since this is going to be the primary means by which the application will associate users with their accounts.

Initially this is all just guess work. You may find yourself re-tweaking this a bunch, but you have to start somewhere, and this is anything but an organic process.

### Expo Web Authentication

Ok, so my real goal here is to be able to use Google authentication without ejecting from Expo. I've looked at many libraries and their documentation for accomplishing this and none met my goal with confidence. So lets attempt this from scratch:

Expo v40 provides [`expo-web-browser`](https://docs.expo.io/versions/latest/sdk/webbrowser/). This will allow the end user to interact with the authentication provider.

Expo v40 provides ['expo-secure-store'](https://docs.expo.io/versions/latest/sdk/securestore/). This will allow our application to store any returned tokens in a secure manner. (Note: In my design, no authentication provider tokens are actually returned to the client.)

React Native provides the ['fetch()'](https://reactnative.dev/docs/network) call. This allows the application to make arbitrary HTTPS calls to external services.

With these components, I initially designed everything so that we'd use the web browser to authenticate the user via Google and then Google would callback to to my application with the relevant credentials. Turns out there are a few problems with this:

* If you wanted to send the Google response back to your application, it needs to use a deep link registered to your application when your application is installed. Since I am using Expo, my application isn't installed and therefore must use the custom scheme URL: `exp://localexpohost:19000`.
* If you attempt to use a custom scheme for your redirect_uri, Google calls foul because you said you were using a `Web Application`. All web applications should be using `https://` as their callback scheme. 
* If you request a token from Google, the data is send after the `#` token in the callback request. This means that all of that data is sent directly to the client and the webserver of the callback never sees the data.

The way I solved all of these issues is with the following process:

1. Kick off a new WebBrowser object with the initial OAuth URL request, but requesting a `code` instead of a `token`.
2. Once the user authentications, the WebBrowser calls back to a specially crafted *trampoline* webpage (hosted on `https://auth.myapp.app/`) that redirects the WebBrowser object back into the application containing the authentication response data appended (with an implicit `dismiss` event for the WebBrowser object). Note: In the case of Expo, we simply use the `exp://localexpohost:19000` for our deep link and when we publish to APK we'll use our official `myapp://` or `https://android.myapp.app/` deep link prefixes.
3. A registered `Linking` event listener sees the authentication response and once again forwards the authentication data to a serverless function endpoint that is responsible for finishing the remainder of the credential processing.

A rudimentary example of the trampoline webpage is:

```html
<html>
  <head></head>
  <body>
    <script>
      var a = document.createElement("a");
      var linkText = document.createTextNode(
        "Go Back To App ... " + window.location.search
      );
      a.appendChild(linkText);
      a.href = "exp://localexpohost:19000/" + window.location.search;
      document.body.appendChild(a);
    </script>
  </body>
</html>
```

This particular piece of code is what I used for testing so it does require an extra click from the user, but that could be easily changed to an automatic redirection. In the worst case, it can become a simple "Authentication Successful" page with a "Click Here To Process" button for the user.

### The MyApp Authentication Overview

Without going into implementation details. In my authentication design, we send a code provided by Google to retrieve the tokens required to get the identity information we require. One of the things that you need to get the tokens in a Web Application authentication flow is a `client_secret`. By keeping the `client_secret` in the serverless function, we keep it from being published as part of the APK. Although not strictly necessary, this does decrease the likely hood of a malicious actor from masquerading as our client for authentication.

The process that I'm using for MyApp:

1. Perform external authentication provider authentication.
2. Verify the provided token (JWT) against the providers public keys.
3. Use email claim from the token (JWT) to lookup/register/login MyApp user.
4. Return special MyApp tokens to client.
5. Client will use access token to access MyApp resources and the refresh token to get new access tokens.

The idea is that we want to avoid ever having to store user secrets in our own database. Instead we leave that to the larger authentication providers. At the same time, we want to normalize the access to our services using already established technologies like JWT. Therefore we authenticate users and then distribute MyApp specific tokens based on the success of the authentication provider tokens.

There are many security implications regarding distributions of our own tokens, but if we're going to be using tokens for authentication anyway, its a nice trade off. Instead of managing user secrets and token verification, we only manage token generation and token verification. Also, not managing user secrets means not having to manage user password changes, email verifications, and so forth.

The way I see it, keep the authentication endpoint super simple and isolated from the rest of the backend (with the signing keys), rotate the refresh keys every few weeks or so, and we should be well off in terms of security posture.

## Conclusion

In conclusion, the security surrounding Google's OAuth (and likely others) is no trivial matter. You need to understand all of the IT associated with it and pre-plan before attempting to use it. Its not one of these throw it together piece by piece, sprint by sprint sort of ordeals. It requires a plan and execution on the whole plan.

I'm just happy that now I feel over the hump and actually have a plan to proceed where I'd felt helpless and overwhelmed for months.