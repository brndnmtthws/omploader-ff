/*
 * $Id$
 *
 * Copyright 2007-2008 David Shakaryan <omp@gentoo.org>
 * Copyright 2007-2008 Brenden Matthews <brenden@rty.ca>
 * Copyright 2007-2008 Jeff Glover <jeff.web@sigmatheory.com>
 *
 * Distributed under the terms of the GNU General Public License v3
 *
 */

var omploader = {
	onLoad: function() {
		// initialization code
        this.videoURLs = new Array();
        this.videoURLs[0] = "youtube.com/watch";

		this.formNames = new Array();
		this.formNames['file'] = "omploadfile";
		this.formNames['pasta'] = "omploadpaste";
		this.formNames['url'] = "omploadurl";

		this.postVars = new Array();
		this.postVars['url'] = "url1";
		this.postVars['file'] = "file1";
		this.postVars['pasta'] = "paste";

// 		this.ompHost = "http://test.peemail.org";  // for testing
		this.ompHost = "http://omploader.org";

		this.ompURL = this.ompHost + "/upload";
		this.ompFileURL = this.ompHost + "/file";
		this.ompPastaURL = this.ompHost + "/paste";

		this.Cc = Components.classes;
		this.Ci = Components.interfaces;
		this.ioService =
			this.Cc['@mozilla.org/network/io-service;1'].getService(this.Ci.nsIIOService);

		this.initialized = true;
		this.strings = document.getElementById("omploader-strings");

		this.contextMenu = document.getElementById("contentAreaContextMenu");
		this.contextMenu.addEventListener("popupshowing", this.showContextMenu, false);
	},

	showContextMenu: function(event) {
	// show or hide the menuitem based on what the context menu is on
	// see http://kb.mozillazine.org/Adding_items_to_menus
		var menuMain = document.getElementById("context-omploader");
		var menuImage = document.getElementById("omploader-image-menuitem");
		var menuBGImage = document.getElementById("omploader-bgimage-menuitem");
		var menuLink = document.getElementById("omploader-link-menuitem");
		var menuPage = document.getElementById("omploader-page-menuitem");
        var menuVid = document.getElementById("omploader-video-menuitem");
		var menuTextSelect = document.getElementById("omploader-textselect-menuitem");
        var pageuri = omploader.URLtoURI(content.document.location.href);

        // The Page item is always visible
        // I don't remember why I did this in the first place
        // but it could be useful in the future
        var numVisibleMenuItems = 1

        menuPage.setAttribute("tooltiptext", pageuri.spec);
        menuPage.setAttribute("label", omploader.strings.getString("pagelabel"));
        menuPage.setAttribute("oncommand", "omploader.onMenuItemCommand(event)");
        if (omploader.get_filename(pageuri.spec).lastIndexOf('.') != -1)
            menuPage.setAttribute("label", omploader.strings.getString("pagelabel") + " or " + omploader.strings.getString("filelabel"));

        menuImage.hidden = true;
        menuImage.setAttribute("label", omploader.strings.getString("imagelabel"));

        menuBGImage.hidden = true;
        menuBGImage.setAttribute("label", omploader.strings.getString("bgimagelabel"));

        menuLink.hidden = true;
        menuLink.setAttribute("label", omploader.strings.getString("linklabel"));

        menuTextSelect.hidden = true;
        menuTextSelect.setAttribute("label", omploader.strings.getString("textselectlabel"));

        menuVid.hidden = true;
        menuVid.setAttribute("label", omploader.strings.getString("videolabel"));
        menuVid.setAttribute("tooltiptext", pageuri.spec);

		if(gContextMenu.onImage) {
			numVisibleMenuItems++;
			menuImage.hidden = false;
            menuImage.setAttribute("label", omploader.strings.getString("imagelabel") +
                    omploader.get_filename_fmt(gContextMenu.target.currentURI.spec));
			menuImage.setAttribute("tooltiptext", gContextMenu.target.currentURI.spec);
			menuImage.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.target.currentURI)");
		}

		if(gContextMenu.hasBGImage) {
			var uri = omploader.URLtoURI(gContextMenu.bgImageURL);
			numVisibleMenuItems++;
			menuBGImage.hidden = false;
            menuBGImage.setAttribute("label", omploader.strings.getString("bgimagelabel") +
                    omploader.get_filename_fmt(gContextMenu.bgImageURL));
			menuBGImage.setAttribute("tooltiptext", gContextMenu.bgImageURL);
			menuBGImage.setAttribute("oncommand", "omploader.onMenuItemURLCommand(gContextMenu.bgImageURL)");
		}

		if(gContextMenu.onLink) {
			numVisibleMenuItems++;
			menuLink.hidden = false;
            menuLink.setAttribute("label", omploader.strings.getString("linklabel") + ": " + gContextMenu.linkURI.spec);
			menuLink.setAttribute("tooltiptext", gContextMenu.linkURI.spec);
			menuLink.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.linkURI)");
		}

        for (key in omploader.videoURLs) {
            if (pageuri.spec.indexOf(omploader.videoURLs[key]) != -1)
                menuVid.hidden = false;
        }

		if (gContextMenu.isTextSelected)
		{
			numVisibleMenuItems++;
			menuTextSelect.hidden = false;
			menuTextSelect.setAttribute("tooltiptext",  getBrowserSelection());
			menuTextSelect.setAttribute("oncommand", "omploader.ompLoadPasta()");
		}

		if (numVisibleMenuItems > 0) {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("omploaderLabel"));
			menuMain.setAttribute("disabled", "false");
		}
		else {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("disableFile"));
			menuMain.setAttribute("disabled", "true");
		}
	},

	onContextMenuItemCommand: function(uri) {
		this.ompLoadURI(uri);
	},

	onMenuItemURLCommand: function(url) {
		this.ompLoadURI(this.URLtoURI(url));
	},

	onMenuItemCommand: function(e) {
		var uri;
		uri = this.URLtoURI(content.document.location.href);
		this.ompLoadURI(uri);
	},

	onToolbarButtonCommand: function(e) {
		this.onMenuItemCommand(e);
	},

	URLtoURI: function(url) {
		return this.ioService.newURI(url, null, null);
	},

	updateToolsPopup: function(e) {
		var menuTools = document.getElementById("omploader-tools");
		var pageuri = this.URLtoURI(content.document.location.href);

		menuTools.setAttribute("tooltiptext", pageuri.spec);
		menuTools.setAttribute("disabled", "false");
	},

	ompLoadURI: function(uri) {
		if(uri.scheme == "file")
			this.ompLoadLocalFile(uri);

		else
			this.ompLoadPostData(uri);
	},

	ompLoadLocalFile: function(uri) {
		var newTab = gBrowser.addTab();
		var tabBr = gBrowser.getBrowserForTab(newTab);
		var doc = tabBr.contentDocument;

		var sbmt = null;
		var frm = doc.createElementNS("http://www.w3.org/1999/xhtml", "form");

		frm.setAttribute("name", this.formNames['file']);

		frm.setAttribute("action", this.ompURL);
		frm.setAttribute("method", "POST");
		frm.setAttribute("enctype", "multipart/form-data");
		frm.setAttribute("style", "display: none;");
		frm.setAttribute("accept-charset", "UTF-8");

		var inp = doc.createElementNS("http://www.w3.org/1999/xhtml", "input");
		inp.setAttribute("type", "file");
		inp.setAttribute("name", this.postVars['file']);
		inp.value = uri.spec;
		frm.appendChild(inp);

		sbmt = doc.createElementNS("http://www.w3.org/1999/xhtml", "input");
		sbmt.setAttribute("type", "submit");
		sbmt.setAttribute("name", "submit");
		sbmt.setAttribute("value", "submit");
		frm.appendChild(sbmt);

		doc.documentElement.appendChild(frm);

		frm.submit();

		//gBrowser.selectedTab = newTab; #open tab in foreground
	},

	ompLoadPasta: function() {
		var focusedWindow = document.commandDispatcher.focusedWindow;
		var selected_text = focusedWindow.getSelection().toString();
		var newTab = gBrowser.addTab(this.ompPastaURL);

		try {
			newTab.removeEventListener("load",  ompPastaEvent, true);
		} catch(e) {}

		newTab.addEventListener("load",
			ompPastaEvent = function(e) {
						omploader.onPastaPageLoad(e, selected_text);
					}, true);

		gBrowser.selectedTab = newTab;

	},

	onPastaPageLoad: function(event, selected_text) {
		var doc = event.target.linkedBrowser.contentDocument;
		if (doc instanceof HTMLDocument) {
			try {
				var frm = doc.forms.namedItem(this.formNames['pasta']);
				var item = frm.elements.namedItem(this.postVars['pasta']);
				item.value = selected_text;
				doc.removeEventListener("load",  ompPastaEvent, true);
			} catch(e) {
				// meh
			}
		}

	},

	ompLoadPostData: function(uri) {

		var dataString = this.postVars['url'] + "=" + uri.spec;

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
	},

    get_filename: function(str) {
        var slash = '/';
        var retval = '';
        if (str.match(/\\/))
            slash = '\\';

        return str.substring(str.lastIndexOf(slash) + 1);
    },

    get_filename_fmt: function(str) {
        var retval = this.get_filename(str);
        if (retval != '')
            retval = ": " + retval;

        return retval;
    }

};

window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);

