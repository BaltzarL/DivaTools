// ==UserScript==
// @name        Page 1 - diva-portal.org
// @namespace   Violentmonkey Scripts
// @match       https://kth.diva-portal.org/dream/add/add1.jsf
// @grant       none
// @version     1.0
// @author      Baltzar Lagerros
// @description Diva auto select the start page.
// ==/UserScript==

document.querySelectorAll("select.iceSelOneMnu")[0].selectedIndex = 18;
