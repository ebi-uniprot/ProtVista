require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * jQuery Browser Plugin v0.0.6
 * https://github.com/gabceb/jquery-browser-plugin
 *
 * Original jquery-browser code Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * http://jquery.org/license
 *
 * Modifications Copyright 2013 Gabriel Cebrian
 * https://github.com/gabceb
 *
 * Released under the MIT license
 *
 * Date: 2013-07-29T17:23:27-07:00
 */


var matched, browser;

var uaMatch = function( ua ) {
  ua = ua.toLowerCase();

  var match = /(opr)[\/]([\w.]+)/.exec( ua ) ||
    /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
    /(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec( ua ) ||
    /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
    /(msie) ([\w.]+)/.exec( ua ) ||
    ua.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec( ua ) ||
    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
    [];

  var platform_match = /(ipad)/.exec( ua ) ||
    /(iphone)/.exec( ua ) ||
    /(android)/.exec( ua ) ||
    /(windows phone)/.exec( ua ) ||
    /(win)/.exec( ua ) ||
    /(mac)/.exec( ua ) ||
    /(linux)/.exec( ua ) ||
    /(cros)/i.exec( ua ) ||
    [];

  return {
    browser: match[ 3 ] || match[ 1 ] || "",
    version: match[ 2 ] || "0",
    platform: platform_match[ 0 ] || ""
  };
};

matched = uaMatch( window.navigator.userAgent );
browser = {};
browser.uaMatch = uaMatch;

if ( matched.browser ) {
  browser[ matched.browser ] = true;
  browser.version = matched.version;
  browser.versionNumber = parseInt(matched.version);
}

if ( matched.platform ) {
  browser[ matched.platform ] = true;
}

// These are all considered mobile platforms, meaning they run a mobile browser
if ( browser.android || browser.ipad || browser.iphone || browser[ "windows phone" ] ) {
  browser.mobile = true;
}

// These are all considered desktop platforms, meaning they run a desktop browser
if ( browser.cros || browser.mac || browser.linux || browser.win ) {
  browser.desktop = true;
}

// Chrome, Opera 15+ and Safari are webkit based browsers
if ( browser.chrome || browser.opr || browser.safari ) {
  browser.webkit = true;
}

// IE11 has a new token so we will assign it msie to avoid breaking changes
if ( browser.rv )
{
  var ie = "msie";

  matched.browser = ie;
  browser[ie] = true;
}

// Opera 15+ are identified as opr
if ( browser.opr )
{
  var opera = "opera";

  matched.browser = opera;
  browser[opera] = true;
}

// Stock Android browsers are marked as Safari on Android.
if ( browser.safari && browser.android )
{
  var android = "android";

  matched.browser = android;
  browser[android] = true;
}

// Assign the name and platform variable
browser.name = matched.browser;
browser.platform = matched.platform;


module.exports = browser;

},{}],"jquery-browser-plugin":[function(require,module,exports){
module.exports = require('./jquery.browser');

},{"./jquery.browser":1}]},{},[]);
