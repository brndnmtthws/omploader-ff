/*
 * $Id$
 *
 * Copyright 2007 David Shakaryan <omp@gentoo.org>
 * Copyright 2007 Brenden Matthews <brenden@rty.ca>
 *
 * Distributed under the terms of the GNU General Public License v3
 *
 */

var omploader = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("omploader-strings");
    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function(e) { this.showContextMenu(e); }, false);
  },

  showContextMenu: function(event) {
    // show or hide the menuitem based on what the context menu is on
    // see http://kb.mozillazine.org/Adding_items_to_menus
  },
  onMenuItemCommand: function(e) {
	var uri;
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	if (gContextMenu.onLink)
		uri = gContextMenu.linkURI;
	else if (gContextMenu.onImage)
		uri = gContextMenu.target.currentURI;
	else {
		var whut;
		whut = content.document.location.href;
		var ioService =
			Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		uri = ioService.newURI(whut, null, null);
	}
	
	var dataString = "url1=" + uri.spec;

	// POST method requests must wrap the encoded text in a MIME
	// stream
	var stringStream = Cc["@mozilla.org/io/string-input-stream;1"].
		createInstance(Ci.nsIStringInputStream);
	if ("data" in stringStream) // Gecko 1.9 or newer
		stringStream.data = dataString;
	else // 1.8 or older
		stringStream.setData(dataString, dataString.length);

	var postData = Cc["@mozilla.org/network/mime-input-stream;1"].
		createInstance(Ci.nsIMIMEInputStream);
	postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
	postData.addContentLength = true;
	postData.setData(stringStream);

	gBrowser.addTab("http://test.peemail.org/upload", uri, null, postData);
  },
  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
    omploader.onMenuItemCommand(e);
  }

};
window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);
