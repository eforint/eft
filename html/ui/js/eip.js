/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/pako.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/ajaxmultiqueue.js}
 * @depends {3rdparty/growl.js}
 * @depends {3rdparty/zeroclipboard.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {util/eftaddress.js}
 */
var EIP = (function(EIP, $, undefined) {
	"use strict";

	EIP.server = "";
	EIP.state = {};
	EIP.blocks = [];
	EIP.genesis = "15565913748216129843";
	EIP.genesisRS = "EFT-PCBM-4N9E-X8U9-FWB3J";

	EIP.account = "";
	EIP.accountRS = ""
	EIP.publicKey = "";
	EIP.accountInfo = {};

	EIP.database = null;
	EIP.databaseSupport = false;

	EIP.settings = {};
	EIP.contacts = {};

	EIP.isTestNet = false;
	EIP.isLocalHost = false;
	EIP.isForging = false;
	EIP.isLeased = false;

	EIP.lastBlockHeight = 0;
	EIP.downloadingBlockchain = false;

	EIP.rememberPassword = false;
	EIP.selectedContext = null;

	EIP.currentPage = "dashboard";
	EIP.currentSubPage = "";
	EIP.pageNumber = 1;
	EIP.itemsPerPage = 50;

	EIP.pages = {};
	EIP.incoming = {};

	EIP.hasLocalStorage = true;
	EIP.inApp = false;
	EIP.appVersion = "";
	EIP.appPlatform = "";
	EIP.assetTableKeys = [];

	EIP.dgsBlockPassed = false;
	EIP.PKAnnouncementBlockPassed = false;

	var stateInterval;
	var stateIntervalSeconds = 30;
	var isScanning = false;

	EIP.init = function() {
		if (window.location.port && window.location.port != "6876") {
			$(".testnet_only").hide();
		} else {
			EIP.isTestNet = true;
			$(".testnet_only, #testnet_login, #testnet_warning").show();
		}

		if (!EIP.server) {
			var hostName = window.location.hostname.toLowerCase();
			EIP.isLocalHost = hostName == "localhost" || hostName == "127.0.0.1" || EIP.isPrivateIP(hostName);
		}

		if (!EIP.isLocalHost) {
			$(".remote_warning").show();
		}

		try {
			window.localStorage;
		} catch (err) {
			EIP.hasLocalStorage = false;
		}

		if (EIP.getCookie("remember_passphrase")) {
			$("#remember_password").prop("checked", true);
		}

		EIP.createDatabase(function() {
			EIP.getSettings();
		});

		EIP.getState(function() {
			setTimeout(function() {
				EIP.checkAliasVersions();
			}, 5000);
		});

		EIP.showLockscreen();

		if (window.parent) {
			var match = window.location.href.match(/\?app=?(win|mac|lin)?\-?([\d\.]+)?/i);

			if (match) {
				EIP.inApp = true;
				if (match[1]) {
					EIP.appPlatform = match[1];
				}
				if (match[2]) {
					EIP.appVersion = match[2];
				}

				if (!EIP.appPlatform || EIP.appPlatform == "mac") {
					var macVersion = navigator.userAgent.match(/OS X 10_([0-9]+)/i);
					if (macVersion && macVersion[1]) {
						macVersion = parseInt(macVersion[1]);

						if (macVersion < 9) {
							$(".modal").removeClass("fade");
						}
					}
				}

				$("#show_console").hide();

				parent.postMessage("loaded", "*");

				window.addEventListener("message", receiveMessage, false);
			}
		}

		EIP.setStateInterval(30);

		if (!EIP.isTestNet) {
			setInterval(EIP.checkAliasVersions, 1000 * 60 * 60);
		}

		EIP.allowLoginViaEnter();

		EIP.automaticallyCheckRecipient();

		$(".show_popover").popover({
			"trigger": "hover"
		});

		$("#dashboard_transactions_table, #transactions_table").on("mouseenter", "td.confirmations", function() {
			$(this).popover("show");
		}).on("mouseleave", "td.confirmations", function() {
			$(this).popover("destroy");
			$(".popover").remove();
		});

		_fix();

		$(window).on("resize", function() {
			_fix();

			if (EIP.currentPage == "asset_exchange") {
				EIP.positionAssetSidebar();
			}
		});

		$("[data-toggle='tooltip']").tooltip();

		$(".sidebar .treeview").tree();

		$("#dgs_search_account_top, #dgs_search_account_center").mask("EFT-****-****-****-*****", {
			"unmask": false
		});

		/*
		$("#asset_exchange_search input[name=q]").addClear({
			right: 0,
			top: 4,
			onClear: function(input) {
				$("#asset_exchange_search").trigger("submit");
			}
		});

		$("#id_search input[name=q], #alias_search input[name=q]").addClear({
			right: 0,
			top: 4
		});*/
	}

	function _fix() {
		var height = $(window).height() - $("body > .header").height();
		//$(".wrapper").css("min-height", height + "px");
		var content = $(".wrapper").height();

		$(".content.content-stretch:visible").width($(".page:visible").width());

		if (content > height) {
			$(".left-side, html, body").css("min-height", content + "px");
		} else {
			$(".left-side, html, body").css("min-height", height + "px");
		}
	}

	EIP.setStateInterval = function(seconds) {
		if (seconds == stateIntervalSeconds && stateInterval) {
			return;
		}

		if (stateInterval) {
			clearInterval(stateInterval);
		}

		stateIntervalSeconds = seconds;

		stateInterval = setInterval(function() {
			EIP.getState();
		}, 1000 * seconds);
	}

	EIP.getState = function(callback) {
		EIP.sendRequest("getBlockchainStatus", function(response) {
			if (response.errorCode) {
				//todo
			} else {
				var firstTime = !("lastBlock" in EIP.state);
				var previousLastBlock = (firstTime ? "0" : EIP.state.lastBlock);

				EIP.state = response;

				if (firstTime) {
					$("#eip_version").html(EIP.state.version).removeClass("loading_dots");
					EIP.getBlock(EIP.state.lastBlock, EIP.handleInitialBlocks);
				} else if (EIP.state.isScanning) {
					//do nothing but reset EIP.state so that when isScanning is done, everything is reset.
					isScanning = true;
				} else if (isScanning) {
					//rescan is done, now we must reset everything...
					isScanning = false;
					EIP.blocks = [];
					EIP.tempBlocks = [];
					EIP.getBlock(EIP.state.lastBlock, EIP.handleInitialBlocks);
					if (EIP.account) {
						EIP.getInitialTransactions();
						EIP.getAccountInfo();
					}
				} else if (previousLastBlock != EIP.state.lastBlock) {
					EIP.tempBlocks = [];
					if (EIP.account) {
						EIP.getAccountInfo();
					}
					EIP.getBlock(EIP.state.lastBlock, EIP.handleNewBlocks);
					if (EIP.account) {
						EIP.getNewTransactions();
					}
				} else {
					if (EIP.account) {
						EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
							EIP.handleIncomingTransactions(unconfirmedTransactions, false);
						});
					}
					//only done so that download progress meter updates correctly based on lastFeederHeight
					if (EIP.downloadingBlockchain) {
						EIP.updateBlockchainDownloadProgress();
					}
				}

				if (callback) {
					callback();
				}
			}
		});
	}

	$("#logo, .sidebar-menu a").click(function(e, data) {
		if ($(this).hasClass("ignore")) {
			$(this).removeClass("ignore");
			return;
		}

		e.preventDefault();

		if ($(this).data("toggle") == "modal") {
			return;
		}

		var page = $(this).data("page");

		if (page == EIP.currentPage) {
			if (data && data.callback) {
				data.callback();
			}
			return;
		}

		$(".page").hide();

		$(document.documentElement).scrollTop(0);

		$("#" + page + "_page").show();

		$(".content-header h1").find(".loading_dots").remove();

		var changeActive = !($(this).closest("ul").hasClass("treeview-menu"));

		if (changeActive) {
			var currentActive = $("ul.sidebar-menu > li.active");

			if (currentActive.hasClass("treeview")) {
				currentActive.children("a").first().addClass("ignore").click();
			} else {
				currentActive.removeClass("active");
			}

			if ($(this).attr("id") && $(this).attr("id") == "logo") {
				$("#dashboard_link").addClass("active");
			} else {
				$(this).parent().addClass("active");
			}
		}

		if (EIP.currentPage != "messages") {
			$("#inline_message_password").val("");
		}

		//EIP.previousPage = EIP.currentPage;
		EIP.currentPage = page;
		EIP.currentSubPage = "";
		EIP.pageNumber = 1;
		EIP.showPageNumbers = false;

		if (EIP.pages[page]) {
			EIP.pageLoading();

			if (data && data.callback) {
				EIP.pages[page](data.callback);
			} else if (data) {
				EIP.pages[page](data);
			} else {
				EIP.pages[page]();
			}
		}
	});

	$("button.goto-page, a.goto-page").click(function(event) {
		event.preventDefault();

		EIP.goToPage($(this).data("page"));
	});

	EIP.loadPage = function(page, callback) {
		EIP.pageLoading();
		EIP.pages[page](callback);
	}

	EIP.goToPage = function(page, callback) {
		var $link = $("ul.sidebar-menu a[data-page=" + page + "]");

		if ($link.length > 1) {
			if ($link.last().is(":visible")) {
				$link = $link.last();
			} else {
				$link = $link.first();
			}
		}

		if ($link.length == 1) {
			if (callback) {
				$link.trigger("click", [{
					"callback": callback
				}]);
			} else {
				$link.trigger("click");
			}
		} else {
			EIP.currentPage = page;
			EIP.currentSubPage = "";
			EIP.pageNumber = 1;
			EIP.showPageNumbers = false;

			$("ul.sidebar-menu a.active").removeClass("active");
			$(".page").hide();
			$("#" + page + "_page").show();
			if (EIP.pages[page]) {
				EIP.pageLoading();
				EIP.pages[page](callback);
			}
		}
	}

	EIP.pageLoading = function() {
		EIP.hasMorePages = false;

		var $pageHeader = $("#" + EIP.currentPage + "_page .content-header h1");
		$pageHeader.find(".loading_dots").remove();
		$pageHeader.append("<span class='loading_dots'><span>.</span><span>.</span><span>.</span></span>");
	}

	EIP.pageLoaded = function(callback) {
		var $currentPage = $("#" + EIP.currentPage + "_page");

		$currentPage.find(".content-header h1 .loading_dots").remove();

		if ($currentPage.hasClass("paginated")) {
			EIP.addPagination();
		}

		if (callback) {
			callback();
		}
	}

	EIP.addPagination = function(section) {
		var output = "";

		if (EIP.pageNumber == 2) {
			output += "<a href='#' data-page='1'>&laquo; " + $.t("previous_page") + "</a>";
		} else if (EIP.pageNumber > 2) {
			//output += "<a href='#' data-page='1'>&laquo; First Page</a>";
			output += " <a href='#' data-page='" + (EIP.pageNumber - 1) + "'>&laquo; " + $.t("previous_page") + "</a>";
		}
		if (EIP.hasMorePages) {
			if (EIP.pageNumber > 1) {
				output += "&nbsp;&nbsp;&nbsp;";
			}
			output += " <a href='#' data-page='" + (EIP.pageNumber + 1) + "'>" + $.t("next_page") + " &raquo;</a>";
		}

		var $paginationContainer = $("#" + EIP.currentPage + "_page .data-pagination");

		if ($paginationContainer.length) {
			$paginationContainer.html(output);
		}
	}

	$(".data-pagination").on("click", "a", function(e) {
		e.preventDefault();

		EIP.goToPageNumber($(this).data("page"));
	});

	EIP.goToPageNumber = function(pageNumber) {
		/*if (!pageLoaded) {
			return;
		}*/
		EIP.pageNumber = pageNumber;

		EIP.pageLoading();

		EIP.pages[EIP.currentPage]();
	}

	EIP.createDatabase = function(callback) {
		var schema = {
			contacts: {
				id: {
					"primary": true,
					"autoincrement": true,
					"type": "NUMBER"
				},
				name: "VARCHAR(100) COLLATE NOCASE",
				email: "VARCHAR(200)",
				account: "VARCHAR(25)",
				accountRS: "VARCHAR(25)",
				description: "TEXT"
			},
			assets: {
				account: "VARCHAR(25)",
				accountRS: "VARCHAR(25)",
				asset: {
					"primary": true,
					"type": "VARCHAR(25)"
				},
				description: "TEXT",
				name: "VARCHAR(10)",
				decimals: "NUMBER",
				quantityQNT: "VARCHAR(15)",
				groupName: "VARCHAR(30) COLLATE NOCASE"
			},
			data: {
				id: {
					"primary": true,
					"type": "VARCHAR(40)"
				},
				contents: "TEXT"
			}
		};

		EIP.assetTableKeys = ["account", "accountRS", "asset", "description", "name", "position", "decimals", "quantityQNT", "groupName"];

		try {
			EIP.database = new WebDB("EIP_USER_DB", schema, 2, 4, function(error, db) {
				if (!error) {
					EIP.databaseSupport = true;

					EIP.loadContacts();

					EIP.database.select("data", [{
						"id": "asset_exchange_version"
					}], function(error, result) {
						if (!result || !result.length) {
							EIP.database.delete("assets", [], function(error, affected) {
								if (!error) {
									EIP.database.insert("data", {
										"id": "asset_exchange_version",
										"contents": 2
									});
								}
							});
						}
					});

					EIP.database.select("data", [{
						"id": "closed_groups"
					}], function(error, result) {
						if (result && result.length) {
							EIP.closedGroups = result[0].contents.split("#");
						} else {
							EIP.database.insert("data", {
								id: "closed_groups",
								contents: ""
							});
						}
					});
					if (callback) {
						callback();
					}
				} else {
					if (callback) {
						callback();
					}
				}
			});
		} catch (err) {
			EIP.database = null;
			EIP.databaseSupport = false;
			if (callback) {
				callback();
			}
		}
	}

	EIP.getAccountInfo = function(firstRun, callback) {
		EIP.sendRequest("getAccount", {
			"account": EIP.account
		}, function(response) {
			var previousAccountInfo = EIP.accountInfo;

			EIP.accountInfo = response;

			if (response.errorCode) {
				$("#account_balance, #account_forged_balance").html("0");
				$("#account_nr_assets").html("0");

				if (EIP.accountInfo.errorCode == 5) {
					if (EIP.downloadingBlockchain) {
						if (EIP.newlyCreatedAccount) {
							var translationKey = (EIP.dgsBlockPassed ? "status_new_account" : "status_new_account_old");
							$("#dashboard_message").addClass("alert-success").removeClass("alert-danger").html($.t(translationKey, {
								"account_id": String(EIP.accountRS).escapeHTML(),
								"public_key": String(EIP.publicKey).escapeHTML()
							}) + "<br /><br />" + $.t("status_blockchain_downloading")).show();
						} else {
							$("#dashboard_message").addClass("alert-success").removeClass("alert-danger").html($.t("status_blockchain_downloading")).show();
						}
					} else if (EIP.state && EIP.state.isScanning) {
						$("#dashboard_message").addClass("alert-danger").removeClass("alert-success").html($.t("status_blockchain_rescanning")).show();
					} else {
						var translationKey = (EIP.dgsBlockPassed ? "status_new_account" : "status_new_account_old");
						$("#dashboard_message").addClass("alert-success").removeClass("alert-danger").html($.t(translationKey, {
							"account_id": String(EIP.accountRS).escapeHTML(),
							"public_key": String(EIP.publicKey).escapeHTML()
						})).show();
					}
				} else {
					$("#dashboard_message").addClass("alert-danger").removeClass("alert-success").html(EIP.accountInfo.errorDescription ? EIP.accountInfo.errorDescription.escapeHTML() : $.t("error_unknown")).show();
				}
			} else {
				if (EIP.accountRS && EIP.accountInfo.accountRS != EIP.accountRS) {
					$.growl("Generated Reed Solomon address different from the one in the blockchain!", {
						"type": "danger"
					});
					EIP.accountRS = EIP.accountInfo.accountRS;
				}

				if (EIP.downloadingBlockchain) {
					$("#dashboard_message").addClass("alert-success").removeClass("alert-danger").html($.t("status_blockchain_downloading")).show();
				} else if (EIP.state && EIP.state.isScanning) {
					$("#dashboard_message").addClass("alert-danger").removeClass("alert-success").html($.t("status_blockchain_rescanning")).show();
				} else if (!EIP.accountInfo.publicKey) {
					$("#dashboard_message").addClass("alert-danger").removeClass("alert-success").html($.t("no_public_key_warning") + " " + $.t("public_key_actions")).show();
				} else {
					$("#dashboard_message").hide();
				}

				//only show if happened within last week
				var showAssetDifference = (!EIP.downloadingBlockchain || (EIP.blocks && EIP.blocks[0] && EIP.state && EIP.state.time - EIP.blocks[0].timestamp < 60 * 60 * 24 * 7));

				if (EIP.databaseSupport) {
					EIP.database.select("data", [{
						"id": "asset_balances_" + EIP.account
					}], function(error, asset_balance) {
						if (asset_balance && asset_balance.length) {
							var previous_balances = asset_balance[0].contents;

							if (!EIP.accountInfo.assetBalances) {
								EIP.accountInfo.assetBalances = [];
							}

							var current_balances = JSON.stringify(EIP.accountInfo.assetBalances);

							if (previous_balances != current_balances) {
								if (previous_balances != "undefined" && typeof previous_balances != "undefined") {
									previous_balances = JSON.parse(previous_balances);
								} else {
									previous_balances = [];
								}
								EIP.database.update("data", {
									contents: current_balances
								}, [{
									id: "asset_balances_" + EIP.account
								}]);
								if (showAssetDifference) {
									EIP.checkAssetDifferences(EIP.accountInfo.assetBalances, previous_balances);
								}
							}
						} else {
							EIP.database.insert("data", {
								id: "asset_balances_" + EIP.account,
								contents: JSON.stringify(EIP.accountInfo.assetBalances)
							});
						}
					});
				} else if (showAssetDifference && previousAccountInfo && previousAccountInfo.assetBalances) {
					var previousBalances = JSON.stringify(previousAccountInfo.assetBalances);
					var currentBalances = JSON.stringify(EIP.accountInfo.assetBalances);

					if (previousBalances != currentBalances) {
						EIP.checkAssetDifferences(EIP.accountInfo.assetBalances, previousAccountInfo.assetBalances);
					}
				}

				$("#account_balance").html(EIP.formatStyledAmount(response.unconfirmedBalanceNQT));
				$("#account_forged_balance").html(EIP.formatStyledAmount(response.forgedBalanceNQT));

				var nr_assets = 0;

				if (response.assetBalances) {
					for (var i = 0; i < response.assetBalances.length; i++) {
						if (response.assetBalances[i].balanceQNT != "0") {
							nr_assets++;
						}
					}
				}

				$("#account_nr_assets").html(nr_assets);

				if (EIP.lastBlockHeight) {
					var isLeased = EIP.lastBlockHeight >= EIP.accountInfo.currentLeasingHeightFrom;
					if (isLeased != EIP.IsLeased) {
						var leasingChange = true;
						EIP.isLeased = isLeased;
					}
				} else {
					var leasingChange = false;
				}

				if (leasingChange ||
					(response.currentLeasingHeightFrom != previousAccountInfo.currentLeasingHeightFrom) ||
					(response.lessors && !previousAccountInfo.lessors) ||
					(!response.lessors && previousAccountInfo.lessors) ||
					(response.lessors && previousAccountInfo.lessors && response.lessors.sort().toString() != previousAccountInfo.lessors.sort().toString())) {
					EIP.updateAccountLeasingStatus();
				}

				if (response.name) {
					$("#account_name").html(response.name.escapeHTML());
				}
			}

			if (firstRun) {
				$("#account_balance, #account_forged_balance, #account_nr_assets").removeClass("loading_dots");
			}

			if (callback) {
				callback();
			}
		});
	}

	EIP.updateAccountLeasingStatus = function() {
		var accountLeasingLabel = "";
		var accountLeasingStatus = "";

		if (EIP.lastBlockHeight >= EIP.accountInfo.currentLeasingHeightFrom) {
			accountLeasingLabel = $.t("leased_out");
			accountLeasingStatus = $.t("balance_is_leased_out", {
				"start": String(EIP.accountInfo.currentLeasingHeightFrom).escapeHTML(),
				"end": String(EIP.accountInfo.currentLeasingHeightTo).escapeHTML(),
				"account": String(EIP.accountInfo.currentLessee).escapeHTML()
			});
			$("#lease_balance_message").html($.t("balance_leased_out_help"));
		} else if (EIP.lastBlockHeight < EIP.accountInfo.currentLeasingHeightTo) {
			accountLeasingLabel = $.t("leased_soon");
			accountLeasingStatus = $.t("balance_will_be_leased_out", {
				"start": String(EIP.accountInfo.currentLeasingHeightFrom).escapeHTML(),
				"end": String(EIP.accountInfo.currentLeasingHeightTo).escapeHTML(),
				"account": String(EIP.accountInfo.currentLessee).escapeHTML()
			});
			$("#lease_balance_message").html($.t("balance_leased_out_help"));
		} else {
			accountLeasingStatus = $.t("balance_not_leased_out");
			$("#lease_balance_message").html($.t("balance_leasing_help"));
		}

		if (EIP.accountInfo.effectiveBalanceEFT == 0) {
			$("#forging_indicator").removeClass("forging");
			$("#forging_indicator span").html($.t("not_forging")).attr("not_forging");
			$("#forging_indicator").show();
			EIP.isForging = false;
		}

		//no reed solomon available? do it myself? todo
		if (EIP.accountInfo.lessors) {
			if (accountLeasingLabel) {
				accountLeasingLabel += ", ";
				accountLeasingStatus += "<br /><br />";
			}

			accountLeasingLabel += $.t("x_lessor", {
				"count": EIP.accountInfo.lessors.length
			});
			accountLeasingStatus += $.t("x_lessor_lease", {
				"count": EIP.accountInfo.lessors.length
			});

			var rows = "";

			for (var i = 0; i < EIP.accountInfo.lessors.length; i++) {
				var lessor = EIP.accountInfo.lessors[i];

				rows += "<tr><td><a href='#' data-user='" + String(lessor).escapeHTML() + "'>" + EIP.getAccountTitle(lessor) + "</a></td></tr>";
			}

			$("#account_lessor_table tbody").empty().append(rows);
			$("#account_lessor_container").show();
		} else {
			$("#account_lessor_table tbody").empty();
			$("#account_lessor_container").hide();
		}

		if (accountLeasingLabel) {
			$("#account_leasing").html(accountLeasingLabel).show();
		} else {
			$("#account_leasing").hide();
		}

		if (accountLeasingStatus) {
			$("#account_leasing_status").html(accountLeasingStatus).show();
		} else {
			$("#account_leasing_status").hide();
		}
	}

	EIP.checkAssetDifferences = function(current_balances, previous_balances) {
		var current_balances_ = {};
		var previous_balances_ = {};

		if (previous_balances.length) {
			for (var k in previous_balances) {
				previous_balances_[previous_balances[k].asset] = previous_balances[k].balanceQNT;
			}
		}

		if (current_balances.length) {
			for (var k in current_balances) {
				current_balances_[current_balances[k].asset] = current_balances[k].balanceQNT;
			}
		}

		var diff = {};

		for (var k in previous_balances_) {
			if (!(k in current_balances_)) {
				diff[k] = "-" + previous_balances_[k];
			} else if (previous_balances_[k] !== current_balances_[k]) {
				var change = (new BigInteger(current_balances_[k]).subtract(new BigInteger(previous_balances_[k]))).toString();
				diff[k] = change;
			}
		}

		for (k in current_balances_) {
			if (!(k in previous_balances_)) {
				diff[k] = current_balances_[k]; // property is new
			}
		}

		var nr = Object.keys(diff).length;

		if (nr == 0) {
			return;
		} else if (nr <= 3) {
			for (k in diff) {
				EIP.sendRequest("getAsset", {
					"asset": k,
					"_extra": {
						"asset": k,
						"difference": diff[k]
					}
				}, function(asset, input) {
					if (asset.errorCode) {
						return;
					}
					asset.difference = input["_extra"].difference;
					asset.asset = input["_extra"].asset;

					if (asset.difference.charAt(0) != "-") {
						var quantity = EIP.formatQuantity(asset.difference, asset.decimals)

						//TODO

						$.growl("You received <a href='#' data-goto-asset='" + String(asset.asset).escapeHTML() + "'>" + quantity + " " + String(asset.name).escapeHTML() + (quantity == "1" ? " asset" : " assets") + "</a>.", {
							"type": "success"
						});
					} else {
						asset.difference = asset.difference.substring(1);

						var quantity = EIP.formatQuantity(asset.difference, asset.decimals)

						$.growl("You sold or transferred <a href='#' data-goto-asset='" + String(asset.asset).escapeHTML() + "'>" + quantity + " " + String(asset.name).escapeHTML() + (quantity == "1" ? " asset" : " assets") + "</a>.", {
							"type": "success"
						});
					}
				});
			}
		} else {
			$.growl($.t("multiple_assets_differences"), {
				"type": "success"
			});
		}
	}

	EIP.checkLocationHash = function(password) {
		if (window.location.hash) {
			var hash = window.location.hash.replace("#", "").split(":")

			if (hash.length == 2) {
				if (hash[0] == "message") {
					var $modal = $("#send_message_modal");
				} else if (hash[0] == "send") {
					var $modal = $("#send_money_modal");
				} else if (hash[0] == "asset") {
					EIP.goToAsset(hash[1]);
					return;
				} else {
					var $modal = "";
				}

				if ($modal) {
					var account_id = String($.trim(hash[1]));
					if (!/^\d+$/.test(account_id) && account_id.indexOf("@") !== 0) {
						account_id = "@" + account_id;
					}

					$modal.find("input[name=recipient]").val(account_id.unescapeHTML()).trigger("blur");
					if (password && typeof password == "string") {
						$modal.find("input[name=secretPhrase]").val(password);
					}
					$modal.modal("show");
				}
			}

			window.location.hash = "#";
		}
	}

	EIP.updateBlockchainDownloadProgress = function() {
		if (EIP.state.lastBlockchainFeederHeight && EIP.state.numberOfBlocks < EIP.state.lastBlockchainFeederHeight) {
			var percentage = parseInt(Math.round((EIP.state.numberOfBlocks / EIP.state.lastBlockchainFeederHeight) * 100), 10);
		} else {
			var percentage = 100;
		}

		if (percentage == 100) {
			$("#downloading_blockchain .progress").hide();
		} else {
			$("#downloading_blockchain .progress").show();
			$("#downloading_blockchain .progress-bar").css("width", percentage + "%");
			$("#downloading_blockchain .sr-only").html($.t("percent_complete", {
				"percent": percentage
			}));
		}
	}

	EIP.checkIfOnAFork = function() {
		if (!EIP.downloadingBlockchain) {
			var onAFork = true;

			if (EIP.blocks && EIP.blocks.length >= 10) {
				for (var i = 0; i < 10; i++) {
					if (EIP.blocks[i].generator != EIP.account) {
						onAFork = false;
						break;
					}
				}
			}

			if (onAFork) {
				$.growl($.t("fork_warning"), {
					"type": "danger"
				});
			}
		}
	}

	$("#id_search").on("submit", function(e) {
		e.preventDefault();

		var id = $.trim($("#id_search input[name=q]").val());

		if (/EFT\-/i.test(id)) {
			EIP.sendRequest("getAccount", {
				"account": id
			}, function(response, input) {
				if (!response.errorCode) {
					response.account = input.account;
					EIP.showAccountModal(response);
				} else {
					$.growl($.t("error_search_no_results"), {
						"type": "danger"
					});
				}
			});
		} else {
			if (!/^\d+$/.test(id)) {
				$.growl($.t("error_search_invalid"), {
					"type": "danger"
				});
				return;
			}
			EIP.sendRequest("getTransaction", {
				"transaction": id
			}, function(response, input) {
				if (!response.errorCode) {
					response.transaction = input.transaction;
					EIP.showTransactionModal(response);
				} else {
					EIP.sendRequest("getAccount", {
						"account": id
					}, function(response, input) {
						if (!response.errorCode) {
							response.account = input.account;
							EIP.showAccountModal(response);
						} else {
							EIP.sendRequest("getBlock", {
								"block": id
							}, function(response, input) {
								if (!response.errorCode) {
									response.block = input.block;
									EIP.showBlockModal(response);
								} else {
									$.growl($.t("error_search_no_results"), {
										"type": "danger"
									});
								}
							});
						}
					});
				}
			});
		}
	});

	return EIP;
}(EIP || {}, jQuery));

$(document).ready(function() {
	EIP.init();
});

function receiveMessage(event) {
	if (event.origin != "file://") {
		return;
	}
	//parent.postMessage("from iframe", "file://");
}