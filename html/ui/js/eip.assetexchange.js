/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.assets = [];
	EIP.assetIds = [];
	EIP.closedGroups = [];
	EIP.assetSearch = false;
	EIP.lastIssuerCheck = false;
	EIP.viewingAsset = false; //viewing non-bookmarked asset
	EIP.currentAsset = {};
	var currentAssetID = 0;

	EIP.pages.asset_exchange = function(callback) {
		$(".content.content-stretch:visible").width($(".page:visible").width());

		if (EIP.databaseSupport) {
			EIP.assets = [];
			EIP.assetIds = [];

			EIP.database.select("assets", null, function(error, assets) {
				//select already bookmarked assets
				$.each(assets, function(index, asset) {
					EIP.cacheAsset(asset);
				});

				//check owned assets, see if any are not yet in bookmarked assets
				if (EIP.accountInfo.unconfirmedAssetBalances) {
					var newAssetIds = [];

					$.each(EIP.accountInfo.unconfirmedAssetBalances, function(key, assetBalance) {
						if (EIP.assetIds.indexOf(assetBalance.asset) == -1) {
							newAssetIds.push(assetBalance.asset);
							EIP.assetIds.push(assetBalance.asset);
						}
					});

					//add to bookmarked assets
					if (newAssetIds.length) {
						var qs = [];

						for (var i = 0; i < newAssetIds.length; i++) {
							qs.push("assets=" + encodeURIComponent(newAssetIds[i]));
						}

						qs = qs.join("&");
						//first get the assets info
						EIP.sendRequest("getAssets+", {
							//special request.. ugly hack.. also does POST due to URL max length
							"querystring": qs
						}, function(response) {
							if (response.assets && response.assets.length) {
								EIP.saveAssetBookmarks(response.assets, function() {
									EIP.loadAssetExchangeSidebar(callback);
								});
							} else {
								EIP.loadAssetExchangeSidebar(callback);
							}
						});
					} else {
						EIP.loadAssetExchangeSidebar(callback);
					}
				} else {
					EIP.loadAssetExchangeSidebar(callback);
				}
			});
		} else {
			//for users without db support, we only need to fetch owned assets
			if (EIP.accountInfo.unconfirmedAssetBalances) {
				var qs = [];

				$.each(EIP.accountInfo.unconfirmedAssetBalances, function(key, assetBalance) {
					if (EIP.assetIds.indexOf(assetBalance.asset) == -1) {
						qs.push("assets=" + encodeURIComponent(assetBalance.asset));
					}
				});

				qs = qs.join("&");

				if (qs) {
					EIP.sendRequest("getAssets+", {
						"querystring": qs
					}, function(response) {
						if (response.assets && response.assets.length) {
							$.each(response.assets, function(key, asset) {
								EIP.cacheAsset(asset);
							});
						}
						EIP.loadAssetExchangeSidebar(callback);
					});
				}
			} else {
				EIP.loadAssetExchangeSidebar(callback);
			}
		}
	}

	EIP.cacheAsset = function(asset) {
		if (EIP.assetIds.indexOf(asset.asset) != -1) {
			return;
		}

		EIP.assetIds.push(asset.asset);

		if (!asset.groupName) {
			asset.groupName = "";
		}

		var asset = {
			"asset": String(asset.asset),
			"name": String(asset.name).toLowerCase(),
			"description": String(asset.description),
			"groupName": String(asset.groupName).toLowerCase(),
			"account": String(asset.account),
			"accountRS": String(asset.accountRS),
			"quantityQNT": String(asset.quantityQNT),
			"decimals": parseInt(asset.decimals, 10)
		};

		EIP.assets.push(asset);
	}

	EIP.forms.addAssetBookmark = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		data.id = $.trim(data.id);

		if (!data.id) {
			return {
				"error": $.t("error_asset_or_account_id_required")
			};
		}

		if (!/^\d+$/.test(data.id) && !/^EFT\-/i.test(data.id)) {
			return {
				"error": $.t("error_asset_or_account_id_invalid")
			};
		}

		if (/^EFT\-/i.test(data.id)) {
			EIP.sendRequest("getAssetsByIssuer", {
				"account": data.id
			}, function(response) {
				if (response.errorCode) {
					EIP.showModalError(EIP.translateServerError(response), $modal);
				} else {
					if (response.assets && response.assets[0] && response.assets[0].length) {
						EIP.saveAssetBookmarks(response.assets[0], EIP.forms.addAssetBookmarkComplete);
					} else {
						EIP.showModalError($.t("account_no_assets"), $modal);
					}
					//EIP.saveAssetIssuer(data.id);
				}
			});
		} else {
			EIP.sendRequest("getAsset", {
				"asset": data.id
			}, function(response) {
				if (response.errorCode) {
					EIP.sendRequest("getAssetsByIssuer", {
						"account": data.id
					}, function(response) {
						if (response.errorCode) {
							EIP.showModalError(EIP.translateServerError(response), $modal);
						} else {
							if (response.assets && response.assets[0] && response.assets[0].length) {
								EIP.saveAssetBookmarks(response.assets[0], EIP.forms.addAssetBookmarkComplete);
								//EIP.saveAssetIssuer(data.id);
							} else {
								EIP.showModalError($.t("no_asset_found"), $modal);
							}
						}
					});
				} else {
					EIP.saveAssetBookmarks(new Array(response), EIP.forms.addAssetBookmarkComplete);
				}
			});
		}
	}

	$("#asset_exchange_bookmark_this_asset").on("click", function() {
		if (EIP.viewingAsset) {
			EIP.saveAssetBookmarks(new Array(EIP.viewingAsset), function(newAssets) {
				EIP.viewingAsset = false;
				EIP.loadAssetExchangeSidebar(function() {
					$("#asset_exchange_sidebar a[data-asset=" + newAssets[0].asset + "]").addClass("active").trigger("click");
				});
			});
		}
	});

	EIP.forms.addAssetBookmarkComplete = function(newAssets, submittedAssets) {
		EIP.assetSearch = false;

		if (newAssets.length == 0) {
			EIP.closeModal();
			$.growl($.t("error_asset_already_bookmarked", {
				"count": submittedAssets.length
			}), {
				"type": "danger"
			});
			$("#asset_exchange_sidebar a.active").removeClass("active");
			$("#asset_exchange_sidebar a[data-asset=" + submittedAssets[0].asset + "]").addClass("active").trigger("click");
			return;
		} else {
			EIP.closeModal();

			var message = $.t("success_asset_bookmarked", {
				"count": newAssets.length
			});

			if (!EIP.databaseSupport) {
				message += " " + $.t("error_assets_save_db");
			}

			$.growl(message, {
				"type": "success"
			});

			EIP.loadAssetExchangeSidebar(function(callback) {
				$("#asset_exchange_sidebar a.active").removeClass("active");
				$("#asset_exchange_sidebar a[data-asset=" + newAssets[0].asset + "]").addClass("active").trigger("click");
			});
		}
	}

	EIP.saveAssetBookmarks = function(assets, callback) {
		var newAssetIds = [];
		var newAssets = [];

		$.each(assets, function(key, asset) {
			var newAsset = {
				"asset": String(asset.asset),
				"name": String(asset.name),
				"description": String(asset.description),
				"account": String(asset.account),
				"accountRS": String(asset.accountRS),
				"quantityQNT": String(asset.quantityQNT),
				"decimals": parseInt(asset.decimals, 10),
				"groupName": ""
			};

			newAssets.push(newAsset);

			if (EIP.databaseSupport) {
				newAssetIds.push({
					"asset": String(asset.asset)
				});
			} else {
				EIP.assetIds.push(asset.asset);
				EIP.assets.push(newAsset);
			}
		});

		if (!EIP.databaseSupport) {
			if (callback) {
				callback(newAssets, assets);
			}
			return;
		}

		EIP.database.select("assets", newAssetIds, function(error, existingAssets) {
			var existingIds = [];

			if (existingAssets.length) {
				$.each(existingAssets, function(index, asset) {
					existingIds.push(asset.asset);
				});

				newAssets = $.grep(newAssets, function(v) {
					return (existingIds.indexOf(v.asset) === -1);
				});
			}

			if (newAssets.length == 0) {
				if (callback) {
					callback([], assets);
				}
			} else {
				EIP.database.insert("assets", newAssets, function(error) {
					$.each(newAssets, function(key, asset) {
						asset.name = asset.name.toLowerCase();
						EIP.assetIds.push(asset.asset);
						EIP.assets.push(asset);
					});

					if (callback) {
						//for some reason we need to wait a little or DB won't be able to fetch inserted record yet..
						setTimeout(function() {
							callback(newAssets, assets);
						}, 50);
					}
				});
			}
		});
	}

	EIP.positionAssetSidebar = function() {
		$("#asset_exchange_sidebar").parent().css("position", "relative");
		$("#asset_exchange_sidebar").parent().css("padding-bottom", "5px");
		//$("#asset_exchange_sidebar_content").height($(window).height() - 120);
		$("#asset_exchange_sidebar").height($(window).height() - 120);
	}

	//called on opening the asset exchange page and automatic refresh
	EIP.loadAssetExchangeSidebar = function(callback) {
		if (!EIP.assets.length) {
			EIP.pageLoaded();
			$("#asset_exchange_sidebar_content").empty();
			$("#no_asset_selected, #loading_asset_data, #no_asset_search_results, #asset_details").hide();
			$("#no_assets_available").show();
			$("#asset_exchange_page").addClass("no_assets");
			return;
		}

		var rows = "";

		$("#asset_exchange_page").removeClass("no_assets");

		EIP.positionAssetSidebar();

		EIP.assets.sort(function(a, b) {
			if (!a.groupName && !b.groupName) {
				if (a.name > b.name) {
					return 1;
				} else if (a.name < b.name) {
					return -1;
				} else {
					return 0;
				}
			} else if (!a.groupName) {
				return 1;
			} else if (!b.groupName) {
				return -1;
			} else if (a.groupName > b.groupName) {
				return 1;
			} else if (a.groupName < b.groupName) {
				return -1;
			} else {
				if (a.name > b.name) {
					return 1;
				} else if (a.name < b.name) {
					return -1;
				} else {
					return 0;
				}
			}
		});

		var lastGroup = "";
		var ungrouped = true;
		var isClosedGroup = false;

		var isSearch = EIP.assetSearch !== false;
		var searchResults = 0;

		for (var i = 0; i < EIP.assets.length; i++) {
			var asset = EIP.assets[i];

			if (isSearch) {
				if (EIP.assetSearch.indexOf(asset.asset) == -1) {
					continue;
				} else {
					searchResults++;
				}
			}

			if (asset.groupName.toLowerCase() != lastGroup) {
				var to_check = (asset.groupName ? asset.groupName : "undefined");

				if (EIP.closedGroups.indexOf(to_check) != -1) {
					isClosedGroup = true;
				} else {
					isClosedGroup = false;
				}

				if (asset.groupName) {
					ungrouped = false;
					rows += "<a href='#' class='list-group-item list-group-item-header" + (asset.groupName == "Ignore List" ? " no-context" : "") + "'" + (asset.groupName != "Ignore List" ? " data-context='asset_exchange_sidebar_group_context' " : "data-context=''") + " data-groupname='" + asset.groupName.escapeHTML() + "' data-closed='" + isClosedGroup + "'><h4 class='list-group-item-heading'>" + asset.groupName.toUpperCase().escapeHTML() + "</h4><i class='fa fa-angle-" + (isClosedGroup ? "right" : "down") + " group_icon'></i></h4></a>";
				} else {
					ungrouped = true;
					rows += "<a href='#' class='list-group-item list-group-item-header no-context' data-closed='" + isClosedGroup + "'><h4 class='list-group-item-heading'>UNGROUPED <i class='fa pull-right fa-angle-" + (isClosedGroup ? "right" : "down") + "'></i></h4></a>";
				}

				lastGroup = asset.groupName.toLowerCase();
			}

			var ownsAsset = false;

			if (EIP.accountInfo.assetBalances) {
				$.each(EIP.accountInfo.assetBalances, function(key, assetBalance) {
					if (assetBalance.asset == asset.asset && assetBalance.balanceQNT != "0") {
						ownsAsset = true;
						return false;
					}
				});
			}

			rows += "<a href='#' class='list-group-item list-group-item-" + (ungrouped ? "ungrouped" : "grouped") + (ownsAsset ? " owns_asset" : " not_owns_asset") + "' data-cache='" + i + "' data-asset='" + String(asset.asset).escapeHTML() + "'" + (!ungrouped ? " data-groupname='" + asset.groupName.escapeHTML() + "'" : "") + (isClosedGroup ? " style='display:none'" : "") + " data-closed='" + isClosedGroup + "'><h4 class='list-group-item-heading'>" + asset.name.escapeHTML() + "</h4><p class='list-group-item-text'>qty: " + EIP.formatQuantity(asset.quantityQNT, asset.decimals) + "</p></a>";
		}

		var active = $("#asset_exchange_sidebar a.active");


		if (active.length) {
			active = active.data("asset");
		} else {
			active = false;
		}

		$("#asset_exchange_sidebar_content").empty().append(rows);
		$("#asset_exchange_sidebar_search").show();

		if (isSearch) {
			if (active && EIP.assetSearch.indexOf(active) != -1) {
				//check if currently selected asset is in search results, if so keep it at that
				$("#asset_exchange_sidebar a[data-asset=" + active + "]").addClass("active");
			} else if (EIP.assetSearch.length == 1) {
				//if there is only 1 search result, click it
				$("#asset_exchange_sidebar a[data-asset=" + EIP.assetSearch[0] + "]").addClass("active").trigger("click");
			}
		} else if (active) {
			$("#asset_exchange_sidebar a[data-asset=" + active + "]").addClass("active");
		}

		if (isSearch || EIP.assets.length >= 10) {
			$("#asset_exchange_sidebar_search").show();
		} else {
			$("#asset_exchange_sidebar_search").hide();
		}

		if (isSearch && EIP.assetSearch.length == 0) {
			$("#no_asset_search_results").show();
			$("#asset_details, #no_asset_selected, #no_assets_available").hide();
		} else if (!$("#asset_exchange_sidebar a.active").length) {
			$("#no_asset_selected").show();
			$("#asset_details, #no_assets_available, #no_asset_search_results").hide();
		} else if (active) {
			$("#no_assets_available, #no_asset_selected, #no_asset_search_results").hide();
		}

		if (EIP.viewingAsset) {
			$("#asset_exchange_bookmark_this_asset").show();
		} else {
			$("#asset_exchange_bookmark_this_asset").hide();
		}

		EIP.pageLoaded(callback);
	}

	EIP.incoming.asset_exchange = function() {
		if (!EIP.viewingAsset) {
			//refresh active asset
			var $active = $("#asset_exchange_sidebar a.active");

			if ($active.length) {
				$active.trigger("click", [{
					"refresh": true
				}]);
			}
		} else {
			EIP.loadAsset(EIP.viewingAsset, true);
		}

		//update assets owned (colored)
		$("#asset_exchange_sidebar a.list-group-item.owns_asset").removeClass("owns_asset").addClass("not_owns_asset");

		if (EIP.accountInfo.assetBalances) {
			$.each(EIP.accountInfo.assetBalances, function(key, assetBalance) {
				if (assetBalance.balanceQNT != "0") {
					$("#asset_exchange_sidebar a.list-group-item[data-asset=" + assetBalance.asset + "]").addClass("owns_asset").removeClass("not_owns_asset");
				}
			});
		}
	}

	$("#asset_exchange_sidebar").on("click", "a", function(e, data) {
		e.preventDefault();

		currentAssetID = String($(this).data("asset")).escapeHTML();

		//refresh is true if data is refreshed automatically by the system (when a new block arrives)
		if (data && data.refresh) {
			var refresh = true;
		} else {
			var refresh = false;
		}

		//clicked on a group
		if (!currentAssetID) {
			if (EIP.databaseSupport) {
				var group = $(this).data("groupname");
				var closed = $(this).data("closed");

				if (!group) {
					var $links = $("#asset_exchange_sidebar a.list-group-item-ungrouped");
				} else {
					var $links = $("#asset_exchange_sidebar a.list-group-item-grouped[data-groupname='" + group.escapeHTML() + "']");
				}

				if (!group) {
					group = "undefined";
				}

				if (closed) {
					var pos = EIP.closedGroups.indexOf(group);
					if (pos >= 0) {
						EIP.closedGroups.splice(pos);
					}
					$(this).data("closed", "");
					$(this).find("i").removeClass("fa-angle-right").addClass("fa-angle-down");
					$links.show();
				} else {
					EIP.closedGroups.push(group);
					$(this).data("closed", true);
					$(this).find("i").removeClass("fa-angle-down").addClass("fa-angle-right");
					$links.hide();
				}

				EIP.database.update("data", {
					"contents": EIP.closedGroups.join("#")
				}, [{
					"id": "closed_groups"
				}]);
			}

			return;
		}

		if (EIP.databaseSupport) {
			EIP.database.select("assets", [{
				"asset": currentAssetID
			}], function(error, asset) {
				if (asset && asset.length && asset[0].asset == currentAssetID) {
					EIP.loadAsset(asset[0], refresh);
				}
			});
		} else {
			EIP.sendRequest("getAsset+", {
				"asset": currentAssetID
			}, function(response, input) {
				if (!response.errorCode && response.asset == currentAssetID) {
					EIP.loadAsset(response, refresh);
				}
			});
		}
	});

	EIP.loadAsset = function(asset, refresh) {
		var assetId = asset.asset;

		EIP.currentAsset = asset;
		EIP.currentSubPage = assetId;

		if (!refresh) {
			$("#asset_exchange_sidebar a.active").removeClass("active");
			$("#asset_exchange_sidebar a[data-asset=" + assetId + "]").addClass("active");

			$("#no_asset_selected, #loading_asset_data, #no_assets_available, #no_asset_search_results").hide();
			$("#asset_details").show().parent().animate({
				"scrollTop": 0
			}, 0);

			$("#asset_account").html("<a href='#' data-user='" + EIP.getAccountFormatted(asset, "account") + "' class='user_info'>" + EIP.getAccountTitle(asset, "account") + "</a>");
			$("#asset_id").html(assetId.escapeHTML());
			$("#asset_decimals").html(String(asset.decimals).escapeHTML());
			$("#asset_name").html(String(asset.name).escapeHTML());
			$("#asset_description").html(String(asset.description).autoLink());
			$("#asset_quantity").html(EIP.formatQuantity(asset.quantityQNT, asset.decimals));

			$(".asset_name").html(String(asset.name).escapeHTML());
			$("#sell_asset_button").data("asset", assetId);
			$("#buy_asset_button").data("asset", assetId);
			$("#sell_asset_for_eft").html($.t("sell_asset_for_eft", {
				"assetName": String(asset.name).escapeHTML()
			}));
			$("#buy_asset_with_eft").html($.t("buy_asset_with_eft", {
				"assetName": String(asset.name).escapeHTML()
			}));
			$("#sell_asset_price, #buy_asset_price").val("");
			$("#sell_asset_quantity, #sell_asset_total, #buy_asset_quantity, #buy_asset_total").val("0");

			$("#asset_exchange_ask_orders_table tbody").empty();
			$("#asset_exchange_bid_orders_table tbody").empty();
			$("#asset_exchange_trade_history_table tbody").empty();
			$("#asset_exchange_ask_orders_table").parent().addClass("data-loading").removeClass("data-empty");
			$("#asset_exchange_bid_orders_table").parent().addClass("data-loading").removeClass("data-empty");
			$("#asset_exchange_trade_history_table").parent().addClass("data-loading").removeClass("data-empty");

			$(".data-loading img.loading").hide();

			setTimeout(function() {
				$(".data-loading img.loading").fadeIn(200);
			}, 200);

			var nrDuplicates = 0;

			$.each(EIP.assets, function(key, singleAsset) {
				if (String(singleAsset.name).toLowerCase() == String(asset.name).toLowerCase() && singleAsset.asset != assetId) {
					nrDuplicates++;
				}
			});

			$("#asset_exchange_duplicates_warning").html($.t("asset_exchange_duplicates_warning", {
				"count": nrDuplicates
			}));

			if (EIP.databaseSupport) {
				EIP.sendRequest("getAsset", {
					"asset": assetId
				}, function(response) {
					if (!response.errorCode) {
						if (response.asset != asset.asset || response.account != asset.account || response.accountRS != asset.accountRS || response.decimals != asset.decimals || response.description != asset.description || response.name != asset.name || response.quantityQNT != asset.quantityQNT) {
							EIP.database.delete("assets", [{
								"asset": asset.asset
							}], function() {
								setTimeout(function() {
									EIP.loadPage("asset_exchange");
									$.growl("Invalid asset.", {
										"type": "danger"
									});
								}, 50);
							});
						}
					}
				});
			}

			if (asset.viewingAsset) {
				$("#asset_exchange_bookmark_this_asset").show();
				EIP.viewingAsset = asset;
			} else {
				$("#asset_exchange_bookmark_this_asset").hide();
				EIP.viewingAsset = false;
			}
		}

		if (EIP.accountInfo.unconfirmedBalanceNQT == "0") {
			$("#your_eft_balance").html("0");
			$("#buy_automatic_price").addClass("zero").removeClass("nonzero");
		} else {
			$("#your_eft_balance").html(EIP.formatAmount(EIP.accountInfo.unconfirmedBalanceNQT));
			$("#buy_automatic_price").addClass("nonzero").removeClass("zero");
		}

		if (EIP.accountInfo.unconfirmedAssetBalances) {
			for (var i = 0; i < EIP.accountInfo.unconfirmedAssetBalances.length; i++) {
				var balance = EIP.accountInfo.unconfirmedAssetBalances[i];

				if (balance.asset == assetId) {
					EIP.currentAsset.yourBalanceNQT = balance.unconfirmedBalanceQNT;
					$("#your_asset_balance").html(EIP.formatQuantity(balance.unconfirmedBalanceQNT, EIP.currentAsset.decimals));
					if (balance.unconfirmedBalanceQNT == "0") {
						$("#sell_automatic_price").addClass("zero").removeClass("nonzero");
					} else {
						$("#sell_automatic_price").addClass("nonzero").removeClass("zero");
					}
					break;
				}
			}
		}

		if (!EIP.currentAsset.yourBalanceNQT) {
			EIP.currentAsset.yourBalanceNQT = "0";
			$("#your_asset_balance").html("0");
		}

		EIP.loadAssetOrders("ask", assetId, refresh);
		EIP.loadAssetOrders("bid", assetId, refresh);

		//todo EIP.currentSubPageID ??...
		EIP.sendRequest("getTrades+" + assetId, {
			"asset": assetId,
			"firstIndex": 0,
			"lastIndex": 50
		}, function(response, input) {
			if (response.trades && response.trades.length) {
				var trades = response.trades;

				var rows = "";

				for (var i = 0; i < trades.length; i++) {
					trades[i].priceNQT = new BigInteger(trades[i].priceNQT);
					trades[i].quantityQNT = new BigInteger(trades[i].quantityQNT);
					trades[i].totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(trades[i].priceNQT, trades[i].quantityQNT));

					rows += "<tr><td>" + EIP.formatTimestamp(trades[i].timestamp) + "</td><td>" + EIP.formatQuantity(trades[i].quantityQNT, EIP.currentAsset.decimals) + "</td><td class='asset_price'>" + EIP.formatOrderPricePerWholeQNT(trades[i].priceNQT, EIP.currentAsset.decimals) + "</td><td>" + EIP.formatAmount(trades[i].totalNQT) + "</td><td>" + String(trades[i].askOrder).escapeHTML() + "</td><td>" + String(trades[i].bidOrder).escapeHTML() + "</td></tr>";
				}

				$("#asset_exchange_trade_history_table tbody").empty().append(rows);
				EIP.dataLoadFinished($("#asset_exchange_trade_history_table"), !refresh);
			} else {
				$("#asset_exchange_trade_history_table tbody").empty();
				EIP.dataLoadFinished($("#asset_exchange_trade_history_table"), !refresh);
			}
		});
	}

	EIP.loadAssetOrders = function(type, assetId, refresh) {
		type = type.toLowerCase();

		EIP.sendRequest("get" + type.capitalize() + "Orders+" + assetId, {
			"asset": assetId,
			"timestamp": 0,
			"limit": 50
		}, function(response, input) {
			var orders = response[type + "Orders"];

			if (!orders) {
				orders = [];
			}

			if (EIP.unconfirmedTransactions.length) {
				var added = false;

				for (var i = 0; i < EIP.unconfirmedTransactions.length; i++) {
					var unconfirmedTransaction = EIP.unconfirmedTransactions[i];
					unconfirmedTransaction.order = unconfirmedTransaction.transaction;

					if (unconfirmedTransaction.type == 2 && (type == "ask" ? unconfirmedTransaction.subtype == 2 : unconfirmedTransaction.subtype == 3) && unconfirmedTransaction.asset == assetId) {
						orders.push($.extend(true, {}, unconfirmedTransaction)); //make sure it's a deep copy
						added = true;
					}
				}

				if (added) {
					orders.sort(function(a, b) {
						if (type == "ask") {
							//lowest price at the top
							return new BigInteger(a.priceNQT).compareTo(new BigInteger(b.priceNQT));
						} else {
							//highest price at the top
							return new BigInteger(b.priceNQT).compareTo(new BigInteger(a.priceNQT));
						}
					});
				}
			}

			if (orders.length) {
				$("#" + (type == "ask" ? "sell" : "buy") + "_orders_count").html("(" + orders.length + (orders.length == 50 ? "+" : "") + ")");

				var rows = "";

				for (var i = 0; i < orders.length; i++) {
					var order = orders[i];

					order.priceNQT = new BigInteger(order.priceNQT);
					order.quantityQNT = new BigInteger(order.quantityQNT);
					order.totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(order.quantityQNT, order.priceNQT));

					if (i == 0 && !refresh) {
						$("#" + (type == "ask" ? "buy" : "sell") + "_asset_price").val(EIP.calculateOrderPricePerWholeQNT(order.priceNQT, EIP.currentAsset.decimals));
					}

					var className = (order.account == EIP.account ? "your-order" : "") + (order.unconfirmed ? " tentative" : (EIP.isUserCancelledOrder(order) ? " tentative tentative-crossed" : ""));

					rows += "<tr class='" + className + "' data-transaction='" + String(order.order).escapeHTML() + "' data-quantity='" + order.quantityQNT.toString().escapeHTML() + "' data-price='" + order.priceNQT.toString().escapeHTML() + "'><td>" + (order.unconfirmed ? "You - <strong>Pending</strong>" : (order.account == EIP.account ? "<strong>You</strong>" : "<a href='#' data-user='" + EIP.getAccountFormatted(order, "account") + "' class='user_info'>" + (order.account == EIP.currentAsset.account ? "Asset Issuer" : EIP.getAccountTitle(order, "account")) + "</a>")) + "</td><td>" + EIP.formatQuantity(order.quantityQNT, EIP.currentAsset.decimals) + "</td><td>" + EIP.formatOrderPricePerWholeQNT(order.priceNQT, EIP.currentAsset.decimals) + "</td><td>" + EIP.formatAmount(order.totalNQT) + "</tr>";
				}

				$("#asset_exchange_" + type + "_orders_table tbody").empty().append(rows);
			} else {
				$("#asset_exchange_" + type + "_orders_table tbody").empty();
				if (!refresh) {
					$("#" + (type == "ask" ? "buy" : "sell") + "_asset_price").val("0");
				}
				$("#" + (type == "ask" ? "sell" : "buy") + "_orders_count").html("");
			}

			EIP.dataLoadFinished($("#asset_exchange_" + type + "_orders_table"), !refresh);
		});
	}

	EIP.isUserCancelledOrder = function(order) {
		if (EIP.unconfirmedTransactions.length) {
			for (var i = 0; i < EIP.unconfirmedTransactions.length; i++) {
				var unconfirmedTransaction = EIP.unconfirmedTransactions[i];

				if (unconfirmedTransaction.type == 2 && (order.type == "ask" ? unconfirmedTransaction.subtype == 4 : unconfirmedTransaction.subtype == 5) && unconfirmedTransaction.attachment.order == order.order) {
					return true;
				}
			}
		}

		return false;
	}

	$("#asset_exchange_search").on("submit", function(e) {
		e.preventDefault();
		$("#asset_exchange_search input[name=q]").trigger("input");
	});

	$("#asset_exchange_search input[name=q]").on("input", function(e) {
		var input = $.trim($(this).val()).toLowerCase();

		if (!input) {
			EIP.assetSearch = false;
			EIP.loadAssetExchangeSidebar();
			$("#asset_exchange_clear_search").hide();
		} else {
			EIP.assetSearch = [];

			if (/EFT\-/i.test(input)) {
				$.each(EIP.assets, function(key, asset) {
					if (asset.accountRS.toLowerCase() == input || asset.accountRS.toLowerCase().indexOf(input) !== -1) {
						EIP.assetSearch.push(asset.asset);
					}
				});
			} else {
				$.each(EIP.assets, function(key, asset) {
					if (asset.account == input || asset.asset == input || asset.name.toLowerCase().indexOf(input) !== -1) {
						EIP.assetSearch.push(asset.asset);
					}
				});
			}

			EIP.loadAssetExchangeSidebar();
			$("#asset_exchange_clear_search").show();
			$("#asset_exchange_show_type").hide();
		}
	});

	$("#asset_exchange_clear_search").on("click", function() {
		$("#asset_exchange_search input[name=q]").val("");
		$("#asset_exchange_search").trigger("submit");
	});

	$("#buy_asset_box .box-header, #sell_asset_box .box-header").click(function(e) {
		e.preventDefault();
		//Find the box parent        
		var box = $(this).parents(".box").first();
		//Find the body and the footer
		var bf = box.find(".box-body, .box-footer");
		if (!box.hasClass("collapsed-box")) {
			box.addClass("collapsed-box");
			$(this).find(".btn i.fa").removeClass("fa-minus").addClass("fa-plus");
			bf.slideUp();
		} else {
			box.removeClass("collapsed-box");
			bf.slideDown();
			$(this).find(".btn i.fa").removeClass("fa-plus").addClass("fa-minus");
		}
	});

	$("#asset_exchange_bid_orders_table tbody, #asset_exchange_ask_orders_table tbody").on("click", "td", function(e) {
		var $target = $(e.target);

		if ($target.prop("tagName").toLowerCase() == "a") {
			return;
		}

		var type = ($target.closest("table").attr("id") == "asset_exchange_bid_orders_table" ? "sell" : "buy");

		var $tr = $target.closest("tr");

		try {
			var priceNQT = new BigInteger(String($tr.data("price")));
			var quantityQNT = new BigInteger(String($tr.data("quantity")));
			var totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(quantityQNT, priceNQT));

			$("#" + type + "_asset_price").val(EIP.calculateOrderPricePerWholeQNT(priceNQT, EIP.currentAsset.decimals));
			$("#" + type + "_asset_quantity").val(EIP.convertToQNTf(quantityQNT, EIP.currentAsset.decimals));
			$("#" + type + "_asset_total").val(EIP.convertToEFT(totalNQT));
		} catch (err) {
			return;
		}

		if (type == "sell") {
			try {
				var balanceNQT = new BigInteger(EIP.accountInfo.unconfirmedBalanceNQT);
			} catch (err) {
				return;
			}

			if (totalNQT.compareTo(balanceNQT) > 0) {
				$("#" + type + "_asset_total").css({
					"background": "#ED4348",
					"color": "white"
				});
			} else {
				$("#" + type + "_asset_total").css({
					"background": "",
					"color": ""
				});
			}
		}

		var box = $("#" + type + "_asset_box");

		if (box.hasClass("collapsed-box")) {
			box.removeClass("collapsed-box");
			box.find(".box-body").slideDown();
		}
	});

	$("#sell_automatic_price, #buy_automatic_price").on("click", function(e) {
		try {
			var type = ($(this).attr("id") == "sell_automatic_price" ? "sell" : "buy");

			var price = new Big(EIP.convertToNQT(String($("#" + type + "_asset_price").val())));
			var balance = new Big(type == "buy" ? EIP.accountInfo.unconfirmedBalanceNQT : EIP.currentAsset.yourBalanceNQT);
			var balanceNQT = new Big(EIP.accountInfo.unconfirmedBalanceNQT);
			var maxQuantity = new Big(EIP.convertToQNTf(EIP.currentAsset.quantityQNT, EIP.currentAsset.decimals));

			if (balance.cmp(new Big("0")) <= 0) {
				return;
			}

			if (price.cmp(new Big("0")) <= 0) {
				//get minimum price if no offers exist, based on asset decimals..
				price = new Big("" + Math.pow(10, EIP.currentAsset.decimals));
				$("#" + type + "_asset_price").val(EIP.convertToEFT(price.toString()));
			}

			var quantity = new Big(EIP.amountToPrecision((type == "sell" ? balanceNQT : balance).div(price).toString(), EIP.currentAsset.decimals));

			var total = quantity.times(price);

			//proposed quantity is bigger than available quantity
			if (quantity.cmp(maxQuantity) == 1) {
				quantity = maxQuantity;
				total = quantity.times(price);
			}

			if (type == "sell") {
				var maxUserQuantity = new Big(EIP.convertToQNTf(balance, EIP.currentAsset.decimals));
				if (quantity.cmp(maxUserQuantity) == 1) {
					quantity = maxUserQuantity;
					total = quantity.times(price);
				}
			}

			$("#" + type + "_asset_quantity").val(quantity.toString());
			$("#" + type + "_asset_total").val(EIP.convertToEFT(total.toString()));

			$("#" + type + "_asset_total").css({
				"background": "",
				"color": ""
			});
		} catch (err) {}
	});

	function isControlKey(charCode) {
		if (charCode >= 32)
			return false;
		if (charCode == 10)
			return false;
		if (charCode == 13)
			return false;

		return true;
	}

	$("#buy_asset_quantity, #buy_asset_price, #sell_asset_quantity, #sell_asset_price, #buy_asset_fee, #sell_asset_fee").keydown(function(e) {
		var charCode = !e.charCode ? e.which : e.charCode;

		if (isControlKey(charCode) || e.ctrlKey || e.metaKey) {
			return;
		}

		var isQuantityField = /_quantity/i.test($(this).attr("id"));

		var maxFractionLength = (isQuantityField ? EIP.currentAsset.decimals : 8 - EIP.currentAsset.decimals);

		if (maxFractionLength) {
			//allow 1 single period character
			if (charCode == 110 || charCode == 190) {
				if ($(this).val().indexOf(".") != -1) {
					e.preventDefault();
					return false;
				} else {
					return;
				}
			}
		} else {
			//do not allow period
			if (charCode == 110 || charCode == 190 || charCode == 188) {
				$.growl($.t("error_fractions"), {
					"type": "danger"
				});
				e.preventDefault();
				return false;
			}
		}

		var input = $(this).val() + String.fromCharCode(charCode);

		var afterComma = input.match(/\.(\d*)$/);

		//only allow as many as there are decimals allowed..
		if (afterComma && afterComma[1].length > maxFractionLength) {
			var selectedText = EIP.getSelectedText();

			if (selectedText != $(this).val()) {
				var errorMessage;

				if (isQuantityField) {
					errorMessage = $.t("error_asset_decimals", {
						"count": (0 + EIP.currentAsset.decimals)
					});
				} else {
					errorMessage = $.t("error_decimals", {
						"count": (8 - EIP.currentAsset.decimals)
					});
				}

				$.growl(errorMessage, {
					"type": "danger"
				});

				e.preventDefault();
				return false;
			}
		}

		//numeric characters, left/right key, backspace, delete
		if (charCode == 8 || charCode == 37 || charCode == 39 || charCode == 46 || (charCode >= 48 && charCode <= 57 && !isNaN(String.fromCharCode(charCode))) || (charCode >= 96 && charCode <= 105)) {
			return;
		} else {
			//comma
			if (charCode == 188) {
				$.growl($.t("error_comma_not_allowed"), {
					"type": "danger"
				});
			}
			e.preventDefault();
			return false;
		}
	});

	//calculate preview price (calculated on every keypress)
	$("#sell_asset_quantity, #sell_asset_price, #buy_asset_quantity, #buy_asset_price").keyup(function(e) {
		var orderType = $(this).data("type").toLowerCase();

		try {
			var quantityQNT = new BigInteger(EIP.convertToQNT(String($("#" + orderType + "_asset_quantity").val()), EIP.currentAsset.decimals));
			var priceNQT = new BigInteger(EIP.calculatePricePerWholeQNT(EIP.convertToNQT(String($("#" + orderType + "_asset_price").val())), EIP.currentAsset.decimals));

			if (priceNQT.toString() == "0" || quantityQNT.toString() == "0") {
				$("#" + orderType + "_asset_total").val("0");
			} else {
				var total = EIP.calculateOrderTotal(quantityQNT, priceNQT, EIP.currentAsset.decimals);
				$("#" + orderType + "_asset_total").val(total.toString());
			}
		} catch (err) {
			$("#" + orderType + "_asset_total").val("0");
		}
	});

	$("#asset_order_modal").on("show.bs.modal", function(e) {
		var $invoker = $(e.relatedTarget);

		var orderType = $invoker.data("type");
		var assetId = $invoker.data("asset");

		$("#asset_order_modal_button").html(orderType + " Asset").data("resetText", orderType + " Asset");

		orderType = orderType.toLowerCase();

		try {
			//TODO
			var quantity = String($("#" + orderType + "_asset_quantity").val());
			var quantityQNT = new BigInteger(EIP.convertToQNT(quantity, EIP.currentAsset.decimals));
			var priceNQT = new BigInteger(EIP.calculatePricePerWholeQNT(EIP.convertToNQT(String($("#" + orderType + "_asset_price").val())), EIP.currentAsset.decimals));
			var feeNQT = new BigInteger(EIP.convertToNQT(String($("#" + orderType + "_asset_fee").val())));
			var totalEFT = EIP.formatAmount(EIP.calculateOrderTotalNQT(quantityQNT, priceNQT, EIP.currentAsset.decimals), false, true);
		} catch (err) {
			$.growl("Invalid input.", {
				"type": "danger"
			});
			return e.preventDefault();
		}

		if (priceNQT.toString() == "0" || quantityQNT.toString() == "0") {
			$.growl($.t("error_amount_price_required"), {
				"type": "danger"
			});
			return e.preventDefault();
		}

		if (feeNQT.toString() == "0") {
			feeNQT = new BigInteger("100000000");
		}

		var priceNQTPerWholeQNT = priceNQT.multiply(new BigInteger("" + Math.pow(10, EIP.currentAsset.decimals)));

		if (orderType == "buy") {
			var description = $.t("buy_order_description", {
				"quantity": EIP.formatQuantity(quantityQNT, EIP.currentAsset.decimals, true),
				"asset_name": $("#asset_name").html().escapeHTML(),
				"eft": EIP.formatAmount(priceNQTPerWholeQNT)
			});
			var tooltipTitle = $.t("buy_order_description_help", {
				"eft": EIP.formatAmount(priceNQTPerWholeQNT, false, true),
				"total_eft": totalEFT
			});
		} else {
			var description = $.t("sell_order_description", {
				"quantity": EIP.formatQuantity(quantityQNT, EIP.currentAsset.decimals, true),
				"asset_name": $("#asset_name").html().escapeHTML(),
				"eft": EIP.formatAmount(priceNQTPerWholeQNT)
			});
			var tooltipTitle = $.t("sell_order_description_help", {
				"eft": EIP.formatAmount(priceNQTPerWholeQNT, false, true),
				"total_eft": totalEFT
			});
		}

		$("#asset_order_description").html(description);
		$("#asset_order_total").html(totalEFT + " EFT");
		$("#asset_order_fee_paid").html(EIP.formatAmount(feeNQT) + " EFT");

		if (quantity != "1") {
			$("#asset_order_total_tooltip").show();
			$("#asset_order_total_tooltip").popover("destroy");
			$("#asset_order_total_tooltip").data("content", tooltipTitle);
			$("#asset_order_total_tooltip").popover({
				"content": tooltipTitle,
				"trigger": "hover"
			});
		} else {
			$("#asset_order_total_tooltip").hide();
		}

		$("#asset_order_type").val((orderType == "buy" ? "placeBidOrder" : "placeAskOrder"));
		$("#asset_order_asset").val(assetId);
		$("#asset_order_quantity").val(quantityQNT.toString());
		$("#asset_order_price").val(priceNQT.toString());
		$("#asset_order_fee").val(feeNQT.toString());
	});

	EIP.forms.orderAsset = function($modal) {
		var orderType = $("#asset_order_type").val();

		return {
			"requestType": orderType,
			"successMessage": (orderType == "placeBidOrder" ? $.t("success_buy_order_asset") : $.t("success_sell_order_asset")),
			"errorMessage": $.t("error_order_asset")
		};
	}

	EIP.forms.orderAssetComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		if (data.requestType == "placeBidOrder") {
			var $table = $("#asset_exchange_bid_orders_table tbody");
		} else {
			var $table = $("#asset_exchange_ask_orders_table tbody");
		}

		if ($table.find("tr[data-transaction='" + String(response.transaction).escapeHTML() + "']").length) {
			return;
		}

		var $rows = $table.find("tr");

		data.quantityQNT = new BigInteger(data.quantityQNT);
		data.priceNQT = new BigInteger(data.priceNQT);
		data.totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(data.quantityQNT, data.priceNQT));

		var rowToAdd = "<tr class='tentative' data-transaction='" + String(response.transaction).escapeHTML() + "' data-quantity='" + data.quantityQNT.toString().escapeHTML() + "' data-price='" + data.priceNQT.toString().escapeHTML() + "'><td>You - <strong>Pending</strong></td><td>" + EIP.formatQuantity(data.quantityQNT, EIP.currentAsset.decimals) + "</td><td>" + EIP.formatOrderPricePerWholeQNT(data.priceNQT, EIP.currentAsset.decimals) + "</td><td>" + EIP.formatAmount(data.totalNQT) + "</td></tr>";

		var rowAdded = false;

		if ($rows.length) {
			$rows.each(function() {
				var rowPrice = new BigInteger(String($(this).data("price")));

				if (data.requestType == "placeBidOrder" && data.priceNQT.compareTo(rowPrice) > 0) {
					$(this).before(rowToAdd);
					rowAdded = true;
					return false;
				} else if (data.requestType == "placeAskOrder" && data.priceNQT.compareTo(rowPrice) < 0) {
					$(this).before(rowToAdd);
					rowAdded = true;
					return false;
				}
			});
		}

		if (!rowAdded) {
			$table.append(rowToAdd);
			$table.parent().parent().removeClass("data-empty").parent().addClass("no-padding");
		}
	}

	EIP.forms.issueAsset = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		data.description = $.trim(data.description);

		if (!data.description) {
			return {
				"error": $.t("error_description_required")
			};
		} else if (!/^\d+$/.test(data.quantity)) {
			return {
				"error": $.t("error_whole_quantity")
			};
		} else {
			data.quantityQNT = String(data.quantity);

			if (data.decimals > 0) {
				for (var i = 0; i < data.decimals; i++) {
					data.quantityQNT += "0";
				}
			}

			delete data.quantity;

			return {
				"data": data
			};
		}
	}

	$("#asset_exchange_sidebar_group_context").on("click", "a", function(e) {
		e.preventDefault();

		var groupName = EIP.selectedContext.data("groupname");
		var option = $(this).data("option");

		if (option == "change_group_name") {
			$("#asset_exchange_change_group_name_old_display").html(groupName.escapeHTML());
			$("#asset_exchange_change_group_name_old").val(groupName);
			$("#asset_exchange_change_group_name_new").val("");
			$("#asset_exchange_change_group_name_modal").modal("show");
		}
	});

	EIP.forms.assetExchangeChangeGroupName = function($modal) {
		var oldGroupName = $("#asset_exchange_change_group_name_old").val();
		var newGroupName = $("#asset_exchange_change_group_name_new").val();

		if (!newGroupName.match(/^[a-z0-9 ]+$/i)) {
			return {
				"error": $.t("error_group_name")
			};
		}

		EIP.database.update("assets", {
			"groupName": newGroupName
		}, [{
			"groupName": oldGroupName
		}], function() {
			setTimeout(function() {
				EIP.loadPage("asset_exchange");
				$.growl($.t("success_group_name_update"), {
					"type": "success"
				});
			}, 50);
		});

		return {
			"stop": true
		};
	}

	$("#asset_exchange_sidebar_context").on("click", "a", function(e) {
		e.preventDefault();

		var assetId = EIP.selectedContext.data("asset");
		var option = $(this).data("option");

		EIP.closeContextMenu();

		if (option == "add_to_group") {
			$("#asset_exchange_group_asset").val(assetId);

			EIP.database.select("assets", [{
				"asset": assetId
			}], function(error, asset) {
				asset = asset[0];

				$("#asset_exchange_group_title").html(String(asset.name).escapeHTML());

				EIP.database.select("assets", [], function(error, assets) {
					//EIP.database.execute("SELECT DISTINCT groupName FROM assets", [], function(groupNames) {					
					var groupNames = [];

					$.each(assets, function(index, asset) {
						if (asset.groupName && $.inArray(asset.groupName, groupNames) == -1) {
							groupNames.push(asset.groupName);
						}
					});

					assets = [];

					groupNames.sort(function(a, b) {
						if (a.toLowerCase() > b.toLowerCase()) {
							return 1;
						} else if (a.toLowerCase() < b.toLowerCase()) {
							return -1;
						} else {
							return 0;
						}
					});

					var groupSelect = $("#asset_exchange_group_group");

					groupSelect.empty();

					$.each(groupNames, function(index, groupName) {
						groupSelect.append("<option value='" + groupName.escapeHTML() + "'" + (asset.groupName && asset.groupName.toLowerCase() == groupName.toLowerCase() ? " selected='selected'" : "") + ">" + groupName.escapeHTML() + "</option>");
					});

					groupSelect.append("<option value='0'" + (!asset.groupName ? " selected='selected'" : "") + ">None</option>");
					groupSelect.append("<option value='-1'>New group</option>");

					$("#asset_exchange_group_modal").modal("show");
				});
			});
		} else if (option == "remove_from_group") {
			EIP.database.update("assets", {
				"groupName": ""
			}, [{
				"asset": assetId
			}], function() {
				setTimeout(function() {
					EIP.loadPage("asset_exchange");
					$.growl($.t("success_asset_group_removal"), {
						"type": "success"
					});
				}, 50);
			});
		} else if (option == "remove_from_bookmarks") {
			var ownsAsset = false;

			if (EIP.accountInfo.unconfirmedAssetBalances) {
				$.each(EIP.accountInfo.unconfirmedAssetBalances, function(key, assetBalance) {
					if (assetBalance.asset == assetId) {
						ownsAsset = true;
						return false;
					}
				});
			}

			if (ownsAsset) {
				$.growl($.t("error_owned_asset_no_removal"), {
					"type": "danger"
				});
			} else {
				//todo save delteed asset ids from accountissuers
				EIP.database.delete("assets", [{
					"asset": assetId
				}], function(error, affected) {
					setTimeout(function() {
						EIP.loadPage("asset_exchange");
						$.growl($.t("success_asset_bookmark_removal"), {
							"type": "success"
						});
					}, 50);
				});
			}
		}
	});

	$("#asset_exchange_group_group").on("change", function() {
		var value = $(this).val();

		if (value == -1) {
			$("#asset_exchange_group_new_group_div").show();
		} else {
			$("#asset_exchange_group_new_group_div").hide();
		}
	});

	EIP.forms.assetExchangeGroup = function($modal) {
		var assetId = $("#asset_exchange_group_asset").val();
		var groupName = $("#asset_exchange_group_group").val();

		if (groupName == 0) {
			groupName = "";
		} else if (groupName == -1) {
			groupName = $("#asset_exchange_group_new_group").val();
		}

		EIP.database.update("assets", {
			"groupName": groupName
		}, [{
			"asset": assetId
		}], function() {
			setTimeout(function() {
				EIP.loadPage("asset_exchange");
				if (!groupName) {
					$.growl($.t("success_asset_group_removal"), {
						"type": "success"
					});
				} else {
					$.growl($.t("sucess_asset_group_add"), {
						"type": "success"
					});
				}
			}, 50);
		});

		return {
			"stop": true
		};
	}

	$("#asset_exchange_group_modal").on("hidden.bs.modal", function(e) {
		$("#asset_exchange_group_new_group_div").val("").hide();
	});

	/* MY ASSETS PAGE */
	EIP.pages.my_assets = function() {
		if (EIP.accountInfo.assetBalances && EIP.accountInfo.assetBalances.length) {
			var result = {
				"assets": [],
				"bid_orders": {},
				"ask_orders": {}
			};
			var count = {
				"total_assets": EIP.accountInfo.assetBalances.length,
				"assets": 0,
				"ignored_assets": 0,
				"ask_orders": 0,
				"bid_orders": 0
			};

			for (var i = 0; i < EIP.accountInfo.assetBalances.length; i++) {
				if (EIP.accountInfo.assetBalances[i].balanceQNT == "0") {
					count.ignored_assets++;
					if (EIP.checkMyAssetsPageLoaded(count)) {
						EIP.myAssetsPageLoaded(result);
					}
					continue;
				}

				EIP.sendRequest("getAskOrderIds+", {
					"asset": EIP.accountInfo.assetBalances[i].asset,
					"limit": 1,
					"timestamp": 0
				}, function(response, input) {
					if (EIP.currentPage != "my_assets") {
						return;
					}

					if (response.askOrderIds && response.askOrderIds.length) {
						EIP.sendRequest("getAskOrder+", {
							"order": response.askOrderIds[0],
							"_extra": {
								"asset": input.asset
							}
						}, function(response, input) {
							if (EIP.currentPage != "my_assets") {
								return;
							}

							response.priceNQT = new BigInteger(response.priceNQT);

							result.ask_orders[input["_extra"].asset] = response.priceNQT;
							count.ask_orders++;
							if (EIP.checkMyAssetsPageLoaded(count)) {
								EIP.myAssetsPageLoaded(result);
							}
						});
					} else {
						result.ask_orders[input.asset] = -1;
						count.ask_orders++;
						if (EIP.checkMyAssetsPageLoaded(count)) {
							EIP.myAssetsPageLoaded(result);
						}
					}
				});

				EIP.sendRequest("getBidOrderIds+", {
					"asset": EIP.accountInfo.assetBalances[i].asset,
					"limit": 1,
					"timestamp": 0
				}, function(response, input) {
					if (EIP.currentPage != "my_assets") {
						return;
					}

					if (response.bidOrderIds && response.bidOrderIds.length) {
						EIP.sendRequest("getBidOrder+", {
							"order": response.bidOrderIds[0],
							"_extra": {
								"asset": input.asset
							}
						}, function(response, input) {
							if (EIP.currentPage != "my_assets") {
								return;
							}

							response.priceNQT = new BigInteger(response.priceNQT);

							result.bid_orders[input["_extra"].asset] = response.priceNQT;
							count.bid_orders++;
							if (EIP.checkMyAssetsPageLoaded(count)) {
								EIP.myAssetsPageLoaded(result);
							}
						});
					} else {
						result.bid_orders[input.asset] = -1;
						count.bid_orders++;
						if (EIP.checkMyAssetsPageLoaded(count)) {
							EIP.myAssetsPageLoaded(result);
						}
					}
				});

				EIP.sendRequest("getAsset+", {
					"asset": EIP.accountInfo.assetBalances[i].asset,
					"_extra": {
						"balanceQNT": EIP.accountInfo.assetBalances[i].balanceQNT
					}
				}, function(asset, input) {
					if (EIP.currentPage != "my_assets") {
						return;
					}

					asset.asset = input.asset;
					asset.balanceQNT = new BigInteger(input["_extra"].balanceQNT);
					asset.quantityQNT = new BigInteger(asset.quantityQNT);

					result.assets[count.assets] = asset;
					count.assets++;

					if (EIP.checkMyAssetsPageLoaded(count)) {
						EIP.myAssetsPageLoaded(result);
					}
				});
			}
		} else {
			EIP.dataLoaded();
		}
	}

	EIP.checkMyAssetsPageLoaded = function(count) {
		if ((count.assets + count.ignored_assets == count.total_assets) && (count.assets == count.ask_orders) && (count.assets == count.bid_orders)) {
			return true;
		} else {
			return false;
		}
	}

	EIP.myAssetsPageLoaded = function(result) {
		var rows = "";

		result.assets.sort(function(a, b) {
			if (a.name.toLowerCase() > b.name.toLowerCase()) {
				return 1;
			} else if (a.name.toLowerCase() < b.name.toLowerCase()) {
				return -1;
			} else {
				return 0;
			}
		});

		for (var i = 0; i < result.assets.length; i++) {
			var asset = result.assets[i];

			var lowestAskOrder = result.ask_orders[asset.asset];
			var highestBidOrder = result.bid_orders[asset.asset];

			var percentageAsset = EIP.calculatePercentage(asset.balanceQNT, asset.quantityQNT);

			if (highestBidOrder != -1) {
				var total = new BigInteger(EIP.calculateOrderTotalNQT(asset.balanceQNT, highestBidOrder, asset.decimals));
			} else {
				var total = 0;
			}

			var tentative = -1;

			if (EIP.unconfirmedTransactions.length) {
				for (var j = 0; j < EIP.unconfirmedTransactions.length; j++) {
					var unconfirmedTransaction = EIP.unconfirmedTransactions[j];

					if (unconfirmedTransaction.type == 2 && unconfirmedTransaction.subtype == 1 && unconfirmedTransaction.attachment.asset == asset.asset) {
						if (tentative == -1) {
							if (unconfirmedTransaction.recipient == EIP.account) {
								tentative = new BigInteger(unconfirmedTransaction.attachment.quantityQNT);
							} else {
								tentative = new BigInteger("-" + unconfirmedTransaction.attachment.quantityQNT);
							}
						} else {
							if (unconfirmedTransaction.recipient == EIP.account) {
								tentative = tentative.add(new BigInteger(unconfirmedTransaction.attachment.quantityQNT));
							} else {
								tentative = tentative.add(new BigInteger("-" + unconfirmedTransaction.attachment.quantityQNT));
							}
						}
					}
				}
			}

			if (highestBidOrder != -1) {
				var totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(asset.balanceQNT, highestBidOrder));
			}

			var sign = "+";

			if (tentative != -1 && tentative.compareTo(BigInteger.ZERO) < 0) {
				tentative = tentative.abs();
				sign = "-";
			}

			rows += "<tr" + (tentative != -1 ? " class='tentative tentative-allow-links'" : "") + " data-asset='" + String(asset.asset).escapeHTML() + "'><td><a href='#' data-goto-asset='" + String(asset.asset).escapeHTML() + "'>" + String(asset.name).escapeHTML() + "</a></td><td class='quantity'>" + EIP.formatQuantity(asset.balanceQNT, asset.decimals) + (tentative != -1 ? " " + sign + " <span class='added_quantity'>" + EIP.formatQuantity(tentative, asset.decimals) + "</span>" : "") + "</td><td>" + EIP.formatQuantity(asset.quantityQNT, asset.decimals) + "</td><td>" + percentageAsset + "%</td><td>" + (lowestAskOrder != -1 ? EIP.formatOrderPricePerWholeQNT(lowestAskOrder, asset.decimals) : "/") + "</td><td>" + (highestBidOrder != -1 ? EIP.formatOrderPricePerWholeQNT(highestBidOrder, asset.decimals) : "/") + "</td><td>" + (highestBidOrder != -1 ? EIP.formatAmount(totalNQT) : "/") + "</td><td><a href='#' data-toggle='modal' data-target='#transfer_asset_modal' data-asset='" + String(asset.asset).escapeHTML() + "' data-name='" + String(asset.name).escapeHTML() + "' data-decimals='" + String(asset.decimals).escapeHTML() + "'>" + $.t("transfer") + "</a></td></tr>";
		}

		EIP.dataLoaded(rows);
	}

	EIP.incoming.my_assets = function() {
		EIP.loadPage("my_assets");
	}

	$("#transfer_asset_modal").on("show.bs.modal", function(e) {
		var $invoker = $(e.relatedTarget);

		var assetId = $invoker.data("asset");
		var assetName = $invoker.data("name");
		var decimals = $invoker.data("decimals");

		$("#transfer_asset_asset").val(assetId);
		$("#transfer_asset_decimals").val(decimals);
		$("#transfer_asset_name, #transfer_asset_quantity_name").html(String(assetName).escapeHTML());
		$("#transer_asset_available").html("");

		var confirmedBalance = 0;
		var unconfirmedBalance = 0;

		if (EIP.accountInfo.assetBalances) {
			$.each(EIP.accountInfo.assetBalances, function(key, assetBalance) {
				if (assetBalance.asset == assetId) {
					confirmedBalance = assetBalance.balanceQNT;
					return false;
				}
			});
		}

		if (EIP.accountInfo.unconfirmedAssetBalances) {
			$.each(EIP.accountInfo.unconfirmedAssetBalances, function(key, assetBalance) {
				if (assetBalance.asset == assetId) {
					unconfirmedBalance = assetBalance.unconfirmedBalanceQNT;
					return false;
				}
			});
		}

		var availableAssetsMessage = "";

		if (confirmedBalance == unconfirmedBalance) {
			availableAssetsMessage = " - " + $.t("available_for_transfer", {
				"qty": EIP.formatQuantity(confirmedBalance, decimals)
			});
		} else {
			availableAssetsMessage = " - " + $.t("available_for_transfer", {
				"qty": EIP.formatQuantity(unconfirmedBalance, decimals)
			}) + " (" + EIP.formatQuantity(confirmedBalance, decimals) + " " + $.t("total_lowercase") + ")";
		}

		$("#transfer_asset_available").html(availableAssetsMessage);
	});

	EIP.forms.transferAsset = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		if (!data.quantity) {
			return {
				"error": $.t("error_not_specified", {
					"name": EIP.getTranslatedFieldName("quantity").toLowerCase()
				}).capitalize()
			};
		}

		if (!EIP.showedFormWarning) {
			if (EIP.settings["asset_transfer_warning"] && EIP.settings["asset_transfer_warning"] != 0) {
				if (new Big(data.quantity).cmp(new Big(EIP.settings["asset_transfer_warning"])) > 0) {
					EIP.showedFormWarning = true;
					return {
						"error": $.t("error_max_asset_transfer_warning", {
							"qty": String(EIP.settings["asset_transfer_warning"]).escapeHTML()
						})
					};
				}
			}
		}

		try {
			data.quantityQNT = EIP.convertToQNT(data.quantity, data.decimals);
		} catch (e) {
			return {
				"error": $.t("error_incorrect_quantity_plus", {
					"err": e.escapeHTML()
				})
			};
		}

		delete data.quantity;
		delete data.decimals;

		if (!data.add_message) {
			delete data.add_message;
			delete data.message;
			delete data.encrypt_message;
		} else if (!EIP.dgsBlockPassed) {
			data.comment = data.message;
			delete data.add_message;
			delete data.message;
			delete data.encrypt_message;
		}

		return {
			"data": data
		};
	}

	EIP.forms.transferAssetComplete = function(response, data) {
		EIP.loadPage("my_assets");
	}

	$("body").on("click", "a[data-goto-asset]", function(e) {
		e.preventDefault();

		var $visible_modal = $(".modal.in");

		if ($visible_modal.length) {
			$visible_modal.modal("hide");
		}

		EIP.goToAsset($(this).data("goto-asset"));
	});

	EIP.goToAsset = function(asset) {
		EIP.assetSearch = false;
		$("#asset_exchange_sidebar_search input[name=q]").val("");
		$("#asset_exchange_clear_search").hide();

		$("#asset_exchange_sidebar a.list-group-item.active").removeClass("active");
		$("#no_asset_selected, #asset_details, #no_assets_available, #no_asset_search_results").hide();
		$("#loading_asset_data").show();

		$("ul.sidebar-menu a[data-page=asset_exchange]").last().trigger("click", [{
			callback: function() {
				var assetLink = $("#asset_exchange_sidebar a[data-asset=" + asset + "]");

				if (assetLink.length) {
					assetLink.click();
				} else {
					EIP.sendRequest("getAsset", {
						"asset": asset
					}, function(response) {
						if (!response.errorCode) {
							EIP.loadAssetExchangeSidebar(function() {
								response.groupName = "";
								response.viewingAsset = true;
								EIP.loadAsset(response);
							});
						} else {
							$.growl($.t("error_asset_not_found"), {
								"type": "danger"
							});
						}
					});
				}
			}
		}]);
	}

	/* OPEN ORDERS PAGE */
	EIP.pages.open_orders = function() {
		var loaded = 0;

		EIP.getOpenOrders("ask", function() {
			loaded++;
			if (loaded == 2) {
				EIP.pageLoaded();
			}
		});

		EIP.getOpenOrders("bid", function() {
			loaded++;
			if (loaded == 2) {
				EIP.pageLoaded();
			}
		});
	}

	EIP.getOpenOrders = function(type, callback) {
		var uppercase = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
		var lowercase = type.toLowerCase();

		var getCurrentOrderIds = "getAccountCurrent" + uppercase + "OrderIds+";
		var orderIds = lowercase + "OrderIds";
		var getOrder = "get" + uppercase + "Order+";

		var orders = [];

		EIP.sendRequest(getCurrentOrderIds, {
			"account": EIP.account,
			"timestamp": 0
		}, function(response) {
			if (response[orderIds] && response[orderIds].length) {
				var nr_orders = 0;

				for (var i = 0; i < response[orderIds].length; i++) {
					EIP.sendRequest(getOrder, {
						"order": response[orderIds][i]
					}, function(order, input) {
						if (EIP.currentPage != "open_orders") {
							return;
						}

						order.order = input.order;
						orders.push(order);

						nr_orders++;

						if (nr_orders == response[orderIds].length) {
							var nr_orders_complete = 0;

							for (var i = 0; i < nr_orders; i++) {
								var order = orders[i];

								EIP.sendRequest("getAsset+", {
									"asset": order.asset,
									"_extra": {
										"id": i
									}
								}, function(asset, input) {
									if (EIP.currentPage != "open_orders") {
										return;
									}

									orders[input["_extra"].id].assetName = asset.name;
									orders[input["_extra"].id].decimals = asset.decimals;

									nr_orders_complete++;

									if (nr_orders_complete == nr_orders) {
										EIP.getUnconfirmedOrders(type, function(unconfirmedOrders) {
											EIP.openOrdersLoaded(orders.concat(unconfirmedOrders), lowercase, callback);
										});
									}
								});

								if (EIP.currentPage != "open_orders") {
									return;
								}
							}
						}
					});

					if (EIP.currentPage != "open_orders") {
						return;
					}
				}
			} else {
				EIP.getUnconfirmedOrders(type, function(unconfirmedOrders) {
					EIP.openOrdersLoaded(unconfirmedOrders, lowercase, callback);
				});
			}
		});
	}

	EIP.getUnconfirmedOrders = function(type, callback) {
		if (EIP.unconfirmedTransactions.length) {
			var unconfirmedOrders = [];

			for (var i = 0; i < EIP.unconfirmedTransactions.length; i++) {
				var unconfirmedTransaction = EIP.unconfirmedTransactions[i];

				if (unconfirmedTransaction.type == 2 && unconfirmedTransaction.subtype == (type == "ask" ? 2 : 3)) {
					unconfirmedOrders.push({
						"account": unconfirmedTransaction.sender,
						"asset": unconfirmedTransaction.attachment.asset,
						"assetName": "",
						"decimals": 0,
						"height": 0,
						"order": unconfirmedTransaction.transaction,
						"priceNQT": unconfirmedTransaction.attachment.priceNQT,
						"quantityQNT": unconfirmedTransaction.attachment.quantityQNT,
						"tentative": true
					})
				}
			}

			if (unconfirmedOrders.length == 0) {
				callback([]);
			} else {
				var nr_orders = 0;

				for (var i = 0; i < unconfirmedOrders.length; i++) {
					EIP.sendRequest("getAsset+", {
						"asset": unconfirmedOrders[i].asset,
						"_extra": {
							"id": i
						}
					}, function(asset, input) {
						unconfirmedOrders[input["_extra"].id].assetName = asset.name;
						unconfirmedOrders[input["_extra"].id].decimals = asset.decimals;

						nr_orders++;

						if (nr_orders == unconfirmedOrders.length) {
							callback(unconfirmedOrders);
						}
					});
				}
			}
		} else {
			callback([]);
		}
	}

	EIP.openOrdersLoaded = function(orders, type, callback) {
		if (!orders.length) {
			$("#open_" + type + "_orders_table tbody").empty();
			EIP.dataLoadFinished($("#open_" + type + "_orders_table"));

			callback();

			return;
		}

		orders.sort(function(a, b) {
			if (a.assetName.toLowerCase() > b.assetName.toLowerCase()) {
				return 1;
			} else if (a.assetName.toLowerCase() < b.assetName.toLowerCase()) {
				return -1;
			} else {
				if (a.quantity * a.price > b.quantity * b.price) {
					return 1;
				} else if (a.quantity * a.price < b.quantity * b.price) {
					return -1;
				} else {
					return 0;
				}
			}
		});

		var rows = "";

		for (var i = 0; i < orders.length; i++) {
			var completeOrder = orders[i];

			var cancelled = false;

			if (EIP.unconfirmedTransactions.length) {
				for (var j = 0; j < EIP.unconfirmedTransactions.length; j++) {
					var unconfirmedTransaction = EIP.unconfirmedTransactions[j];

					if (unconfirmedTransaction.type == 2 && unconfirmedTransaction.subtype == (type == "ask" ? 4 : 5) && unconfirmedTransaction.attachment.order == completeOrder.order) {
						cancelled = true;
						break;
					}
				}
			}

			completeOrder.priceNQT = new BigInteger(completeOrder.priceNQT);
			completeOrder.quantityQNT = new BigInteger(completeOrder.quantityQNT);
			completeOrder.totalNQT = new BigInteger(EIP.calculateOrderTotalNQT(completeOrder.quantityQNT, completeOrder.priceNQT));

			rows += "<tr data-order='" + String(completeOrder.order).escapeHTML() + "'" + (cancelled ? " class='tentative tentative-crossed'" : (completeOrder.tentative ? " class='tentative'" : "")) + "><td><a href='#' data-goto-asset='" + String(completeOrder.asset).escapeHTML() + "'>" + completeOrder.assetName.escapeHTML() + "</a></td><td>" + EIP.formatQuantity(completeOrder.quantityQNT, completeOrder.decimals) + "</td><td>" + EIP.formatOrderPricePerWholeQNT(completeOrder.priceNQT, completeOrder.decimals) + "</td><td>" + EIP.formatAmount(completeOrder.totalNQT) + "</td><td class='cancel'>" + (cancelled || completeOrder.tentative ? "/" : "<a href='#' data-toggle='modal' data-target='#cancel_order_modal' data-order='" + String(completeOrder.order).escapeHTML() + "' data-type='" + type + "'>" + $.t("cancel") + "</a>") + "</td></tr>";
		}

		$("#open_" + type + "_orders_table tbody").empty().append(rows);

		EIP.dataLoadFinished($("#open_" + type + "_orders_table"));
		orders = {};

		callback();
	}

	EIP.incoming.open_orders = function(transactions) {
		if (EIP.hasTransactionUpdates(transactions)) {
			EIP.loadPage("open_orders");
		}
	}

	$("#cancel_order_modal").on("show.bs.modal", function(e) {
		var $invoker = $(e.relatedTarget);

		var orderType = $invoker.data("type");
		var orderId = $invoker.data("order");

		if (orderType == "bid") {
			$("#cancel_order_type").val("cancelBidOrder");
		} else {
			$("#cancel_order_type").val("cancelAskOrder");
		}

		$("#cancel_order_order").val(orderId);
	});

	EIP.forms.cancelOrder = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		var requestType = data.cancel_order_type;

		delete data.cancel_order_type;

		return {
			"data": data,
			"requestType": requestType
		};
	}

	EIP.forms.cancelOrderComplete = function(response, data) {
		if (data.requestType == "cancelAskOrder") {
			$.growl($.t("success_cancel_sell_order"), {
				"type": "success"
			});
		} else {
			$.growl($.t("success_cancel_buy_order"), {
				"type": "success"
			});
		}

		if (response.alreadyProcessed) {
			return;
		}

		$("#open_orders_page tr[data-order=" + String(data.order).escapeHTML() + "]").addClass("tentative tentative-crossed").find("td.cancel").html("/");
	}

	return EIP;
}(EIP || {}, jQuery));