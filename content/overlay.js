/*
 * $Id$
 *
 * Copyright 2007 David Shakaryan <omp@gentoo.org>
 * Copyright 2007 Brenden Matthews <brenden@rty.ca>
 * Copyright 2007 Jeff Glover <jeff.web@sigmatheory.com>
 *
 * Distributed under the terms of the GNU General Public License v3
 *
 */

var omploader = {
	onLoad: function() {
		// initialization code
		this.postVars = new Array();
		this.postVars['url'] = "url1=";
		this.postVars['file'] = "file1="; // one day this may useful

		this.ompURL = "http://omploader.org/upload";
// 		this.ompURL = "http://test.peemail.org/upload"; // for testing

		this.Cc = Components.classes;
		this.Ci = Components.interfaces;
		this.ioService =
			this.Cc['@mozilla.org/network/io-service;1'].getService(this.Ci.nsIIOService);

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
	},

	onContextMenuItemCommand: function(uri) {
		//alert( uri.spec );
		this.ompLoadURI(uri);
	},

	onMenuItemURLCommand: function(url) {
		this.onContextMenuItemCommand(this.ioService.newURI(url, null, null));
	},

	onMenuItemCommand: function(e) {
		var uri;

		uri = this.ioService.newURI(content.document.location.href, null, null);

		this.ompLoadURI(uri);
	},

	onToolbarButtonCommand: function(e) {
		this.onMenuItemCommand(e);
	},

	updateToolsPopup: function(e) {
		var menuTools = document.getElementById("omploader-tools");
		menuTools.setAttribute("tooltiptext", content.document.location.href);
	},

	ompLoadURI: function(uri) {
		if(uri.scheme == "file")
			alert("Ompload does not yet support omploading local files.\n\nUser contributions are welcome. If you are interested in helping omploader, http://developer.mozilla.org/en/docs/XMLHttpRequest may be a good start to omplement this feature. In addition the ImageBot extension (http://pimpsofpain.com/imagebot.html) also uses similar functionality.");

		else {
			var dataString = this.postVars['url'] + uri.spec;
		
			// POST method requests must wrap the encoded text in a MIME
			// stream
			var stringStream = this.Cc["@mozilla.org/io/string-input-stream;1"].
				createInstance(this.Ci.nsIStringInputStream);
			if ("data" in stringStream) // Gecko 1.9 or newer
				stringStream.data = dataString;
			else // 1.8 or older
				stringStream.setData(dataString, dataString.length);
		
			var postData = this.Cc["@mozilla.org/network/mime-input-stream;1"].
				createInstance(this.Ci.nsIMIMEInputStream);
			postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
			postData.addContentLength = true;
			postData.setData(stringStream);
		
			gBrowser.addTab(this.ompURL, uri, null, postData);
		}
	}

};

window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);

