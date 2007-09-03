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
	},

	showContextMenu: function(event) {
	// show or hide the menuitem based on what the context menu is on
	// see http://kb.mozillazine.org/Adding_items_to_menus

		var menuImage = document.getElementById("omploader-image-menuitem");
		var menuBGImage = document.getElementById("omploader-bgimage-menuitem");
		var menuLink = document.getElementById("omploader-link-menuitem");
		var menuPage = document.getElementById("omploader-page-menuitem");
	
		if(gContextMenu.onImage) {
			menuImage.hidden = false;
			menuImage.setAttribute("tooltiptext", gContextMenu.target.currentURI.spec);
			menuImage.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.target.currentURI)");
		}
		else
			menuImage.hidden = true;
	
		if(gContextMenu.hasBGImage) {
			menuBGImage.hidden = false;
			menuBGImage.setAttribute("tooltiptext", gContextMenu.bgImageURL);
			menuBGImage.setAttribute("oncommand", "omploader.onMenuItemURLCommand(gContextMenu.bgImageURL)");
		}
		else
			menuBGImage.hidden = true;
	
		if(gContextMenu.onLink) {
			menuLink.hidden = false;
			menuLink.setAttribute("tooltiptext", gContextMenu.linkURI.spec);
			menuLink.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.linkURI)");
		}
		else
			menuLink.hidden = true;
	
		menuPage.setAttribute("tooltiptext", content.document.location.href);
		menuPage.setAttribute("oncommand", "onMenuItemURLCommand(content.document.location.href)");
	},

	onContextMenuItemCommand: function(uri) {
		//alert( uri.spec );
		this.ompLoadURI(uri);
	},

	onMenuItemURLCommand: function(url) {
		const Cc = Components.classes;
		const Ci = Components.interfaces;

		var ioService =
		Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

		this.onContextMenuItemCommand(ioService.newURI(url, null, null));
	},
	onMenuItemCommand: function(e) {
		var uri;
		const Cc = Components.classes;
		const Ci = Components.interfaces;
		if (gContextMenu.onImage)
			uri = gContextMenu.target.currentURI;
		else if (gContextMenu.onLink)
			uri = gContextMenu.linkURI;
		else {
			var whut;
			whut = content.document.location.href;
			var ioService =
				Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
			uri = ioService.newURI(whut, null, null);
		}

		omploader.ompLoadURI(uri);
	},

	onToolbarButtonCommand: function(e) {
		// just reuse the function above.	you can change this, obviously!
		omploader.onMenuItemCommand(e);
	},

	updateToolsPopup: function(e) {
		var menuTools = document.getElementById("omploader-tools");
		menuTools.setAttribute("tooltiptext", content.document.location.href);
		
// 		var toolBar = document.getElementById("omploader-toolbar-button");		
// 		toolBar.setAttribute("tooltiptext", this.strings.getString("omploaderLabel") + " " + content.document.location.href);
	},

	ompLoadURI: function(uri) {
		const Cc = Components.classes;
		const Ci = Components.interfaces;
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
	
		gBrowser.addTab("http://omploader.org/upload", uri, null, postData);
	}

};
window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);

