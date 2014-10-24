/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	var _goodsToShow;
	var _currentSeller;

	EIP.getMarketplaceItemHTML = function(good) {
		return "<div style='float:right;color: #999999;background:white;padding:5px;border:1px solid #ccc;border-radius:3px'>" +
			"<strong>" + $.t("seller") + "</strong>: <span><a href='#' data-user='" + EIP.getAccountFormatted(good, "seller") + "' class='user_info'>" + EIP.getAccountTitle(good, "seller") + "</a></span><br>" +
			"<strong>" + $.t("product_id") + "</strong>: &nbsp;<a href='#'' data-toggle='modal' data-target='#dgs_product_modal' data-goods='" + String(good.goods).escapeHTML() + "'>" + String(good.goods).escapeHTML() + "</a>" +
			"</div>" +
			"<h3 class='title'><a href='#' data-goods='" + String(good.goods).escapeHTML() + "' data-toggle='modal' data-target='#dgs_purchase_modal'>" + String(good.name).escapeHTML() + "</a></h3>" +
			"<div class='price'><strong>" + EIP.formatAmount(good.priceNQT) + " EFT</strong></div>" +
			"<div class='showmore'><div class='moreblock description'>" + String(good.description).escapeHTML().nl2br() + "</div></div>" +
			"<span class='quantity'><strong>" + $.t("quantity") + "</strong>: " + EIP.format(good.quantity) + "</span> <span class='tags'><strong>" + $.t("tags") + "</strong>: " + String(good.tags).escapeHTML() + "</span><hr />";
	}

	EIP.getMarketplacePurchaseHTML = function(purchase, showBuyer) {
		var status, statusHTML, modal;

		if (purchase.unconfirmed) {
			status = $.t("tentative");
		} else if (purchase.pending) {
			status = $.t("pending");
			statusHTML = "<span class='label label-warning'>" + $.t("pending") + "</span>";
		} else if (purchase.refundNQT) {
			status = $.t("refunded");
			modal = "#dgs_view_refund_modal";
		} else if (!purchase.goodsData) {
			var currentTime = (new Date() - Date.UTC(2014, 9, 23, 12, 0, 0, 0)) / 1000;
			if (purchase.deliveryDeadlineTimestamp < currentTime) {
				status = $.t("not_delivered_in_time");
			} else {
				status = $.t("failed");
			}
		} else {
			status = $.t("complete");
		}

		return "<div data-purchase='" + String(purchase.purchase).escapeHTML() + "'" + (purchase.unconfirmed ? " class='tentative'" : "") + "><div style='float:right;color: #999999;background:white;padding:5px;border:1px solid #ccc;border-radius:3px'>" +
			(showBuyer ? "<strong>" + $.t("buyer") + "</strong>: <span><a href='#' data-user='" + EIP.getAccountFormatted(purchase, "buyer") + "' class='user_info'>" + EIP.getAccountTitle(purchase, "buyer") + "</a></span><br>" :
			"<strong>" + $.t("seller") + "</strong>: <span><a href='#' data-user='" + EIP.getAccountFormatted(purchase, "seller") + "' class='user_info'>" + EIP.getAccountTitle(purchase, "seller") + "</a></span><br>") +
			"<strong>" + $.t("product_id") + "</strong>: &nbsp;<a href='#'' data-toggle='modal' data-target='#dgs_product_modal' data-goods='" + String(purchase.goods).escapeHTML() + "'>" + String(purchase.goods).escapeHTML() + "</a>" +
			"</div>" +
			"<h3 class='title'><a href='#' data-purchase='" + String(purchase.purchase).escapeHTML() + "' data-toggle='modal' data-target='" + (modal ? modal : "#dgs_view_delivery_modal") + "'>" + String(purchase.name).escapeHTML() + "</a></h3>" +
			"<table>" +
			"<tr><td style='width:150px'><strong>" + $.t("order_date") + "</strong>:</td><td>" + EIP.formatTimestamp(purchase.timestamp) + "</td></tr>" +
			"<tr><td><strong>" + $.t("order_status") + "</strong>:</td><td><span class='order_status'>" + (statusHTML ? statusHTML : status) + "</span></td></tr>" +
			(purchase.pending ? "<tr><td><strong>" + $.t("delivery_deadline") + "</strong>:</td><td>" + EIP.formatTimestamp(purchase.deliveryDeadlineTimestamp) + "</td></tr>" : "") +
			"<tr><td><strong>" + $.t("price") + "</strong>:</td><td>" + EIP.formatAmount(purchase.priceNQT) + " EFT</td></tr>" +
			"<tr><td><strong>" + $.t("quantity") + "</strong>:</td><td>" + EIP.format(purchase.quantity) + "</td></tr>" +
			(purchase.seller == EIP.account && purchase.feedbackNote ? "<tr><td><strong>" + $.t("feedback") + "</strong>:</td><td>" + $.t("includes_feedback") + "</td></tr>" : "") +
			"</table></div>" +
			"<hr />";
	}

	EIP.getMarketplacePendingOrderHTML = function(purchase) {
		var delivered = EIP.getUnconfirmedTransactionsFromCache(3, [5, 7], {
			"purchase": purchase.purchase
		});

		return "<div data-purchase='" + String(purchase.purchase).escapeHTML() + "'" + (delivered ? " class='tentative'" : "") + "><div style='float:right;color: #999999;background:white;padding:5px;border:1px solid #ccc;border-radius:3px'>" +
			"<strong>" + $.t("buyer") + "</strong>: <span><a href='#' data-user='" + EIP.getAccountFormatted(purchase, "buyer") + "' class='user_info'>" + EIP.getAccountTitle(purchase, "buyer") + "</a></span><br>" +
			"<strong>" + $.t("product_id") + "</strong>: &nbsp;<a href='#'' data-toggle='modal' data-target='#dgs_product_modal' data-goods='" + String(purchase.goods).escapeHTML() + "'>" + String(purchase.goods).escapeHTML() + "</a>" +
			"</div>" +
			"<h3 class='title'><a href='#' data-purchase='" + String(purchase.purchase).escapeHTML() + "' data-toggle='modal' data-target='#dgs_view_purchase_modal'>" + String(purchase.name).escapeHTML() + "</a></h3>" +
			"<table class='purchase' style='margin-bottom:5px'>" +
			"<tr><td style='width:150px'><strong>Order Date</strong>:</td><td>" + EIP.formatTimestamp(purchase.timestamp) + "</td></tr>" +
			"<tr><td><strong>" + $.t("delivery_deadline") + "</strong>:</td><td>" + EIP.formatTimestamp(purchase.deliveryDeadlineTimestamp) + "</td></tr>" +
			"<tr><td><strong>" + $.t("price") + "</strong>:</td><td>" + EIP.formatAmount(purchase.priceNQT) + " EFT</td></tr>" +
			"<tr><td><strong>" + $.t("quantity") + "</strong>:</td><td>" + EIP.format(purchase.quantity) + "</td></tr>" +
			"</table>" +
			"<span class='delivery'>" + (!delivered ? "<button type='button' class='btn btn-default btn-deliver' data-toggle='modal' data-target='#dgs_delivery_modal' data-purchase='" + String(purchase.purchase).escapeHTML() + "'>" + $.t("deliver_goods") + "</button>" : $.t("delivered")) + "</span>" +
			"</div><hr />";
	}

	EIP.pages.dgs_search = function(callback) {
		var content = "";

		var seller = $.trim($(".dgs_search input[name=q]").val());

		if (seller) {
			if (seller != _currentSeller) {
				$("#dgs_search_contents").empty();
				_currentSeller = seller;
			}

			$("#dgs_search_results").show();
			$("#dgs_search_center").hide();
			$("#dgs_search_top").show();

			EIP.sendRequest("getDGSGoods+", {
				"seller": seller,
				"firstIndex": EIP.pageNumber * EIP.itemsPerPage - EIP.itemsPerPage,
				"lastIndex": EIP.pageNumber * EIP.itemsPerPage
			}, function(response) {
				$("#dgs_search_contents").empty();

				if (response.goods && response.goods.length) {
					if (response.goods.length > EIP.itemsPerPage) {
						EIP.hasMorePages = true;
						response.goods.pop();
					}

					var content = "";

					for (var i = 0; i < response.goods.length; i++) {
						content += EIP.getMarketplaceItemHTML(response.goods[i]);
					}
				}

				EIP.dataLoaded(content);
				EIP.showMore();

				if (callback) {
					callback();
				}
			});
		} else {
			$("#dgs_search_center").show();
			$("#dgs_search_top").hide();
			$("#dgs_search_results").hide();
			$("#dgs_search_contents").empty();
			EIP.pageLoaded();
		}
	}

	EIP.pages.purchased_dgs = function() {
		var content = "";

		if (EIP.pageNumber == 1) {

			var unconfirmedTransactions = EIP.getUnconfirmedTransactionsFromCache(3, 4, {
				"sender": EIP.account
			});

			if (unconfirmedTransactions) {
				for (var i = 0; i < unconfirmedTransactions.length; i++) {
					var unconfirmedTransaction = unconfirmedTransactions[i];
					content += EIP.getMarketplacePurchaseHTML(unconfirmedTransaction);
				}
			}
		}

		EIP.sendRequest("getDGSPurchases+", {
			"buyer": EIP.account,
			"firstIndex": EIP.pageNumber * EIP.itemsPerPage - EIP.itemsPerPage,
			"lastIndex": EIP.pageNumber * EIP.itemsPerPage
		}, function(response) {
			if (response.purchases && response.purchases.length) {
				if (response.purchases.length > EIP.itemsPerPage) {
					EIP.hasMorePages = true;
					response.purchases.pop();
				}

				for (var i = 0; i < response.purchases.length; i++) {
					content += EIP.getMarketplacePurchaseHTML(response.purchases[i]);
				}
			}

			EIP.dataLoaded(content);
		});
	}

	EIP.incoming.purchased_dgs = function(transactions) {
		if (EIP.hasTransactionUpdates(transactions)) {
			EIP.loadPage("purchased_dgs");
		}
	}

	EIP.pages.completed_orders_dgs = function() {
		EIP.sendRequest("getDGSPurchases+", {
			"seller": EIP.account,
			"completed": true,
			"firstIndex": EIP.pageNumber * EIP.itemsPerPage - EIP.itemsPerPage,
			"lastIndex": EIP.pageNumber * EIP.itemsPerPage
		}, function(response) {
			var content = "";

			if (response.purchases && response.purchases.length) {
				if (response.purchases.length > EIP.itemsPerPage) {
					EIP.hasMorePages = true;
					response.purchases.pop();
				}

				for (var i = 0; i < response.purchases.length; i++) {
					content += EIP.getMarketplacePurchaseHTML(response.purchases[i], true);
				}
			}

			EIP.dataLoaded(content);
		});
	}

	EIP.incoming.completed_orders_dgs = function() {
		EIP.loadPage("completed_orders_dgs");
	}

	EIP.pages.pending_orders_dgs = function() {
		EIP.sendRequest("getDGSPendingPurchases+", {
			"seller": EIP.account,
			"firstIndex": EIP.pageNumber * EIP.itemsPerPage - EIP.itemsPerPage,
			"lastIndex": EIP.pageNumber * EIP.itemsPerPage
		}, function(response) {
			var content = "";

			if (response.purchases && response.purchases.length) {
				if (response.purchases.length > EIP.itemsPerPage) {
					EIP.hasMorePages = true;
					response.purchases.pop();
				}

				for (var i = 0; i < response.purchases.length; i++) {
					content += EIP.getMarketplacePendingOrderHTML(response.purchases[i]);
				}
			}

			EIP.dataLoaded(content);
		});
	}

	EIP.incoming.pending_orders_dgs = function() {
		EIP.loadPage("pending_orders_dgs");
	}

	EIP.pages.my_dgs_listings = function() {
		var rows = "";

		var unconfirmedTransactions = EIP.getUnconfirmedTransactionsFromCache(3, 0);

		if (unconfirmedTransactions) {
			for (var i = 0; i < unconfirmedTransactions.length; i++) {
				var unconfirmedTransaction = unconfirmedTransactions[i];

				rows += "<tr class='tentative' data-goods='" + String(unconfirmedTransaction.goods).escapeHTML() + "'><td><a href='#' data-toggle='modal' data-target='#dgs_listing_modal' data-goods='" + String(unconfirmedTransaction.goods).escapeHTML() + "'>" + String(unconfirmedTransaction.name).escapeHTML() + "</a></td><td class='quantity'>" + EIP.format(unconfirmedTransaction.quantity) + "</td><td class='price'>" + EIP.formatAmount(unconfirmedTransaction.priceNQT) + " EFT</td><td style='white-space:nowrap'><a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_price_change_modal' data-goods='" + String(unconfirmedTransaction.goods).escapeHTML() + "'>" + $.t("change_price") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_quantity_change_modal' data-goods='" + String(unconfirmedTransaction.goods).escapeHTML() + "'>" + $.t("change_qty") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_delisting_modal' data-goods='" + String(unconfirmedTransaction.goods).escapeHTML() + "'>" + $.t("delete") + "</a></td></tr>";
			}
		}

		EIP.sendRequest("getDGSGoods+", {
			"seller": EIP.account,
			"firstIndex": EIP.pageNumber * EIP.itemsPerPage - EIP.itemsPerPage,
			"lastIndex": EIP.pageNumber * EIP.itemsPerPage,
			"inStockOnly": "false"
		}, function(response) {
			if (response.goods && response.goods.length) {
				if (response.goods.length > EIP.itemsPerPage) {
					EIP.hasMorePages = true;
					response.goods.pop();
				}

				for (var i = 0; i < response.goods.length; i++) {
					var good = response.goods[i];

					var deleted = false;
					var tentative = false;
					var quantityFormatted = false;

					var unconfirmedTransaction = EIP.getUnconfirmedTransactionFromCache(3, [1, 2, 3], {
						"goods": good.goods
					});

					if (unconfirmedTransaction) {
						if (unconfirmedTransaction.subtype == 1) {
							deleted = tentative = true;
						} else if (unconfirmedTransaction.subtype == 2) {
							good.priceNQT = unconfirmedTransaction.priceNQT;
							tentative = true;
						} else {
							good.quantity = EIP.format(good.quantity) + (String(unconfirmedTransaction.deltaQuantity).charAt(0) != "-" ? "+" : "") + EIP.format(unconfirmedTransaction.deltaQuantity);
							tentative = true;
							quantityFormatted = true;
						}
					}

					rows += "<tr class='" + (tentative ? "tentative" : "") + (deleted ? " tentative-crossed" : "") + "' data-goods='" + String(good.goods).escapeHTML() + "'><td><a href='#' data-toggle='modal' data-target='#dgs_product_modal' data-goods='" + String(good.goods).escapeHTML() + "'>" + String(good.name).escapeHTML() + "</a></td><td class='quantity'>" + (quantityFormatted ? good.quantity : EIP.format(good.quantity)) + "</td><td class='price'>" + EIP.formatAmount(good.priceNQT) + " EFT</td><td style='white-space:nowrap'><a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_price_change_modal' data-goods='" + String(good.goods).escapeHTML() + "'>" + $.t("change_price") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_quantity_change_modal' data-goods='" + String(good.goods).escapeHTML() + "'>" + $.t("change_qty") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_delisting_modal' data-goods='" + String(good.goods).escapeHTML() + "'>" + $.t("delete") + "</a></td></tr>";
				}
			}

			EIP.dataLoaded(rows);
		});
	}

	EIP.incoming.my_dgs_listings = function(transactions) {
		EIP.loadPage("my_dgs_listings");
	}

	EIP.forms.dgsListing = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		$.each(data, function(key, value) {
			data[key] = $.trim(value);
		});

		if (!data.description) {
			return {
				"error": $.t("error_description_required")
			};
		}

		if (data.tags) {
			data.tags = data.tags.toLowerCase();

			var tags = data.tags.split(",");

			if (tags.length > 3) {
				return {
					"error": $.t("error_max_tags", {
						"nr": 3
					})
				};
			} else {
				var clean_tags = [];

				for (var i = 0; i < tags.length; i++) {
					var tag = $.trim(tags[i]);

					if (tag.length < 3 || tag.length > 20) {
						return {
							"error": $.t("error_incorrect_tag_length", {
								"min": 3,
								"max": 20
							})
						};
					} else if (!tag.match(/^[a-z]+$/i)) {
						return {
							"error": $.t("error_incorrect_tag_alpha")
						};
					} else if (clean_tags.indexOf(tag) > -1) {
						return {
							"error": $.t("error_duplicate_tags")
						};
					} else {
						clean_tags.push(tag);
					}
				}

				data.tags = clean_tags.join(",")
			}
		}

		return {
			"data": data
		};
	}

	EIP.forms.dgsListingComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		if (EIP.currentPage == "my_dgs_listings") {
			var $table = $("#my_dgs_listings_table tbody");

			var rowToAdd = "<tr class='tentative' data-goods='" + String(response.transaction).escapeHTML() + "'><td><a href='#' data-toggle='modal' data-target='#dgs_listing_modal' data-goods='" + String(response.transaction).escapeHTML() + "'>" + String(data.name).escapeHTML() + "</a></td><td class='quantity'>" + EIP.format(data.quantity) + "</td><td class='price'>" + EIP.formatAmount(data.priceNQT) + " EFT</td><td style='white-space:nowrap'><a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_price_change_modal' data-goods='" + String(response.transaction).escapeHTML() + "'>" + $.t("change_price") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_quantity_change_modal' data-goods='" + String(response.transaction).escapeHTML() + "'>" + $.t("change_qty") + "</a> <a class='btn btn-xs btn-default' href='#' data-toggle='modal' data-target='#dgs_delisting_modal' data-goods='" + String(response.transaction).escapeHTML() + "'>" + $.t("delete") + "</a></td></tr>";

			$table.prepend(rowToAdd);

			if ($("#my_dgs_listings_table").parent().hasClass("data-empty")) {
				$("#my_dgs_listings_table").parent().removeClass("data-empty");
			}
		}
	}

	EIP.forms.dgsDelistingComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		$("#my_dgs_listings_table tr[data-goods=" + String(data.goods).escapeHTML() + "]").addClass("tentative tentative-crossed");
	}

	EIP.forms.dgsFeedback = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		EIP.sendRequest("getDGSPurchase", {
			"purchase": data.purchase
		}, function(response) {
			if (response.errorCode) {
				return {
					"error": $.t("error_purchase")
				};
			} else {
				data.seller = response.seller;
			}
		}, false);

		data.add_message = true;

		if (data.feedback_type == "public") {
			data.encrypt_message = false;
		} else {
			data.encrypt_message = true;
		}

		delete data.seller;
		delete data.feedback_type;

		return {
			"data": data
		};
	}

	EIP.forms.dgsPurchase = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		EIP.sendRequest("getDGSGood", {
			"goods": data.goods
		}, function(response) {
			if (response.errorCode) {
				return {
					"error": $.t("error_goods")
				};
			} else {
				data.seller = response.seller;
			}
		}, false);

		data.deliveryDeadlineTimestamp = String(Math.floor((new Date() - Date.UTC(2014, 9, 23, 12, 0, 0, 0)) / 1000) + (60 * 60 * data.deliveryDeadlineTimestamp));

		delete data.seller;

		return {
			"data": data
		};
	}

	EIP.forms.dgsRefund = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		EIP.sendRequest("getDGSPurchase", {
			"purchase": data.purchase
		}, function(response) {
			if (!response.errorCode) {
				data.buyer = response.buyer;
			} else {
				data.buyer = false;
			}
		}, false);

		if (data.buyer === false) {
			return {
				"error": $.t("error_purchase")
			};
		}

		if (data.message) {
			data.add_message = true;
			data.encrypt_message = true;
		}

		delete data.buyer;

		return {
			"data": data
		};
	}

	EIP.forms.dgsDelivery = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		EIP.sendRequest("getDGSPurchase", {
			"purchase": data.purchase
		}, function(response) {
			if (!response.errorCode) {
				data.buyer = response.buyer;
			} else {
				data.buyer = false;
			}
		}, false);

		if (data.buyer === false) {
			return {
				"error": $.t("error_purchase")
			};
		}

		if (data.data) {
			try {
				var encrypted = EIP.encryptNote(data.data, {
					"account": data.buyer
				}, data.secretPhrase);

				data.goodsData = encrypted.message;
				data.goodsNonce = encrypted.nonce;
				data.goodsIsText = "true";
			} catch (err) {
				return {
					"error": err.message
				};
			}
		}

		delete data.buyer;
		delete data.data;

		return {
			"data": data
		};
	}

	EIP.forms.dgsQuantityChange = function($modal) {
		var data = EIP.getFormData($modal.find("form:first"));

		EIP.sendRequest("getDGSGood", {
			"goods": data.goods
		}, function(response) {
			if (!response.errorCode) {
				if (data.quantity == response.quantity) {
					data.deltaQuantity = "0";
				} else {
					var quantityA = new BigInteger(String(data.quantity));
					var quantityB = new BigInteger(String(response.quantity));

					if (quantityA.compareTo(quantityB) > 0) {
						data.deltaQuantity = quantityA.subtract(quantityB).toString();
					} else {
						data.deltaQuantity = "-" + quantityB.subtract(quantityA).toString();
					}
				}
			} else {
				data.deltaQuantity = false;
			}
		}, false);

		if (data.deltaQuantity === false) {
			return {
				"error": $.t("error_goods")
			};
		}

		if (data.deltaQuantity == "0") {
			return {
				"error": $.t("error_quantity_no_change")
			};
		}

		delete data.quantity;

		return {
			"data": data
		};
	}

	EIP.forms.dgsQuantityChangeComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		var quantityField = $("#my_dgs_listings_table tr[data-goods=" + String(data.goods).escapeHTML() + "]").addClass("tentative").find(".quantity");

		quantityField.html(quantityField.html() + (String(data.deltaQuantity).charAt(0) != "-" ? "+" : "") + EIP.format(data.deltaQuantity));
	}

	EIP.forms.dgsPriceChangeComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		$("#my_dgs_listings_table tr[data-goods=" + String(data.goods).escapeHTML() + "]").addClass("tentative").find(".price").html(EIP.formatAmount(data.priceNQT) + " EFT");
	}

	EIP.forms.dgsRefundComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		if (EIP.currentPage == "completed_orders_dgs") {
			var $row = $("#completed_orders_dgs_contents div[data-purchase=" + String(data.purchase).escapeHTML() + "]");
			if ($row.length) {
				$row.addClass("tentative");
				$row.find("span.order_status").html($.t("refunded"));
			}
		}
	}

	EIP.forms.dgsDeliveryComplete = function(response, data) {
		if (response.alreadyProcessed) {
			return;
		}

		if (EIP.currentPage == "pending_orders_dgs") {
			$("#pending_orders_dgs_contents div[data-purchase=" + String(data.purchase).escapeHTML() + "]").addClass("tentative").find("span.delivery").html($.t("delivered"));
		}
	}

	$("#dgs_refund_modal, #dgs_delivery_modal, #dgs_feedback_modal, #dgs_view_purchase_modal, #dgs_view_delivery_modal, #dgs_view_refund_modal").on("show.bs.modal", function(e) {
		var $modal = $(this);
		var $invoker = $(e.relatedTarget);

		var type = $modal.attr("id");

		var purchase = $invoker.data("purchase");

		$modal.find("input[name=purchase]").val(purchase);

		EIP.sendRequest("getDGSPurchase", {
			"purchase": purchase
		}, function(response) {
			if (response.errorCode) {
				e.preventDefault();
				$.growl($.t("error_purchase"), {
					"type": "danger"
				});
			} else {
				EIP.sendRequest("getDGSGood", {
					"goods": response.goods
				}, function(good) {
					if (response.errorCode) {
						e.preventDefault();
						$.growl($.t("error_products"), {
							"type": "danger"
						});
					} else {
						var output = "<table>";
						output += "<tr><th style='width:85px;'><strong>" + $.t("product") + "</strong>:</th><td>" + String(good.name).escapeHTML() + "</td></tr>";
						output += "<tr><th><strong>" + $.t("price") + "</strong>:</th><td>" + EIP.formatAmount(response.priceNQT) + " EFT</td></tr>";
						output += "<tr><th><strong>" + $.t("quantity") + "</strong>:</th><td>" + EIP.format(response.quantity) + "</td></tr>";

						if (type == "dgs_refund_modal" || type == "dgs_delivery_modal" || type == "dgs_feedback_modal") {
							if (response.seller == EIP.account) {
								$modal.find("input[name=recipient]").val(response.buyerRS);
							} else {
								$modal.find("input[name=recipient]").val(response.sellerRS);
							}
							if (response.quantity != "1") {
								var orderTotal = EIP.formatAmount(new BigInteger(String(response.quantity)).multiply(new BigInteger(String(response.priceNQT))));
								output += "<tr><th><strong>" + $.t("total") + "</strong>:</th><td>" + orderTotal + " EFT</td></tr>";
							}
							if (response.discountNQT && (type == "dgs_refund_modal" || type == "dgs_feedback_modal")) {
								output += "<tr><th><strong>" + $.t("discount") + "</strong>:</th><td>" + EIP.formatAmount(response.discountNQT) + " EFT</td></tr>";
							}
						}

						if (response.seller == EIP.account) {
							output += "<tr><th><strong>" + $.t("buyer") + "</strong>:</th><td><a href='#' data-user='" + EIP.getAccountFormatted(response, "buyer") + "' class='user_info'>" + EIP.getAccountTitle(response, "buyer") + "</a></td></tr>";
						} else {
							output += "<tr><th><strong>" + $.t("seller") + "</strong>:</th><td><a href='#' data-user='" + EIP.getAccountFormatted(response, "seller") + "' class='user_info'>" + EIP.getAccountTitle(response, "seller") + "</a></td></tr>";
						}

						if (type == "dgs_view_refund_modal") {
							output += "<tr><th><strong>" + $.t("refund_price") + "</strong>:</th><td>" + EIP.formatAmount(response.refundNQT) + " EFT</td></tr>";
						}

						if (response.note && (type == "dgs_view_purchase_modal" || type == "dgs_delivery_modal")) {
							output += "<tr><th><strong>" + $.t("note") + "</strong>:</th><td id='" + type + "_note'></td></tr>";
						}

						output += "</table>";

						$modal.find(".purchase_info").html(output);

						if (response.note && (type == "dgs_view_purchase_modal" || type == "dgs_delivery_modal")) {
							try {
								EIP.tryToDecrypt(response, {
									"note": ""
								}, (response.buyer == EIP.account ? response.seller : response.buyer), {
									"identifier": "purchase",
									"formEl": "#" + type + "_note",
									"outputEl": "#" + type + "_note",
									"showFormOnClick": true
								});
							} catch (err) {
								response.note = String(err.message);
							}
						}

						if (type == "dgs_refund_modal") {
							var orderTotal = new BigInteger(String(response.quantity)).multiply(new BigInteger(String(response.priceNQT)));
							var refund = orderTotal.subtract(new BigInteger(String(response.discountNQT)));

							$("#dgs_refund_purchase").val(response.purchase);
							$("#dgs_refund_refund").val(EIP.convertToEFT(refund));
						} else if (type == "dgs_view_purchase_modal") {
							var $btn = $modal.find("button.btn-primary");
							$btn.data("purchase", response.purchase);
						} else if (type == "dgs_view_refund_modal") {
							EIP.tryToDecrypt(response, {
								"refundNote": $.t("Refund Note")
							}, (response.buyer == EIP.account ? response.seller : response.buyer), {
								"identifier": "purchase",
								"noPadding": true,
								"formEl": "#dgs_view_refund_output",
								"outputEl": "#dgs_view_refund_output"
							});
						} else if (type == "dgs_view_delivery_modal") {
							if (response.pending) {
								e.preventDefault();
								$.growl($.t("error_goods_not_yet_delivered"), {
									"type": "warning"
								});
								return;
							}

							var fieldsToDecrypt = {
								"goodsData": "Data"
							};

							if (response.feedbackNote) {
								fieldsToDecrypt["feedbackNote"] = $.t("feedback_given");
							}

							if (response.refundNote) {
								fieldsToDecrypt["refundNote"] = $.t("refund_note");
							}

							EIP.tryToDecrypt(response, fieldsToDecrypt, (response.buyer == EIP.account ? response.seller : response.buyer), {
								"identifier": "purchase",
								"noPadding": true,
								"formEl": "#dgs_view_delivery_output",
								"outputEl": "#dgs_view_delivery_output"
							});

							if (type == "dgs_view_delivery_modal") {
								if (!response.pending && !response.goodsData) {
									var currentTime = (new Date() - Date.UTC(2014, 9, 23, 12, 0, 0, 0)) / 1000;
									if (response.deliveryDeadlineTimestamp < currentTime) {
										$("#dgs_view_delivery_output").append("<div class='callout callout-danger' style='margin-bottom:0'>" + $.t("purchase_not_delivered_in_time") + "</div>");
									} else {
										$("#dgs_view_delivery_output").append("<div class='callout callout-danger' style='margin-bottom:0'>" + $.t("purchase_failed") + "</div>");
									}
								}
							}

							var $btn = $modal.find("button.btn-primary:not([data-ignore=true])");

							if (!response.feedbackNote) {
								if (EIP.account == response.buyer) {
									$btn.data("purchase", response.purchase);
									$btn.attr("data-target", "#dgs_feedback_modal");
									$btn.html($.t("give_feedback"));
									$btn.show();
								} else {
									$btn.hide();
								}
							} else {
								$btn.hide();
							}

							if (!response.refundNote && EIP.account == response.seller) {
								$btn.data("purchase", response.purchase);
								$btn.attr("data-target", "#dgs_refund_modal");
								$btn.html($.t("refund_purchase"));
								$btn.show();
							}
						}
					}
				}, false);
			}
		}, false);
	}).on("hidden.bs.modal", function(e) {
		var type = $(this).attr("id");

		EIP.removeDecryptionForm($(this));

		$(this).find(".purchase_info").html($.t("loading"));

		if (type == "dgs_refund_modal") {
			$("#dgs_refund_purchase").val("");
		} else if (type == "dgs_view_delivery_modal") {
			$("#dgs_delivery_purchase").val("");
			$("#dgs_view_delivery_output").empty();
			$(this).find("button.btn-primary").data("purchase", "");
		}
	});

	$("#dgs_product_modal, #dgs_delisting_modal, #dgs_quantity_change_modal, #dgs_price_change_modal, #dgs_purchase_modal").on("show.bs.modal", function(e) {
		var $modal = $(this);
		var $invoker = $(e.relatedTarget);

		var type = $modal.attr("id");

		if (!$invoker.length) {
			var goods = _goodsToShow;
			_goodsToShow = 0;
		} else {
			var goods = $invoker.data("goods");
		}

		$modal.find("input[name=goods]").val(goods);

		EIP.sendRequest("getDGSGood", {
			"goods": goods
		}, function(response) {
			if (response.errorCode) {
				e.preventDefault();
				$.growl($.t("error_goods"), {
					"type": "danger"
				});
			} else {
				var output = "<table>";
				output += "<tr><th style='width:85px'><strong>" + $.t("product") + "</strong>:</th><td>" + String(response.name).escapeHTML() + "</td></tr>";
				output += "<tr><th><strong>" + $.t("price") + "</strong>:</th><td>" + EIP.formatAmount(response.priceNQT) + " EFT</td></tr>";
				output += "<tr><th><strong>" + $.t("seller") + "</strong>:</th><td><a href='#' data-user='" + EIP.getAccountFormatted(response, "seller") + "' class='user_info'>" + EIP.getAccountTitle(response, "seller") + "</a></td></tr>";
				output += "<tr><th><strong>" + $.t("quantity") + "</strong>:</th><td>" + EIP.format(response.quantity) + "</td></tr>";

				if (type == "dgs_purchase_modal" || type == "dgs_product_modal") {
					output += "<tr><td colspan='2'><div style='max-height:150px;overflow:auto;'>" + String(response.description).escapeHTML().nl2br() + "</div></td></tr>";
				}

				output += "</table>";
			}

			$modal.find(".goods_info").html(output);

			if (type == "dgs_quantity_change_modal") {
				$("#dgs_quantity_change_current_quantity, #dgs_quantity_change_quantity").val(String(response.quantity).escapeHTML());
			} else if (type == "dgs_price_change_modal") {
				$("#dgs_price_change_current_price, #dgs_price_change_price").val(EIP.convertToEFT(response.priceNQT).escapeHTML());
			} else if (type == "dgs_purchase_modal") {
				$modal.find("input[name=recipient]").val(response.sellerRS);

				$("#dgs_purchase_price").val(String(response.priceNQT).escapeHTML());
				$("#dgs_total_purchase_price").html(EIP.formatAmount(response.priceNQT) + " EFT");

				$("#dgs_purchase_quantity").on("change", function() {
					var totalNQT = new BigInteger(response.priceNQT).multiply(new BigInteger(String($(this).val()))).toString();
					$("#dgs_total_purchase_price").html(EIP.formatAmount(totalNQT) + " EFT");
				});
			}
		}, false);
	}).on("hidden.bs.modal", function(e) {
		$("#dgs_purchase_quantity").off("change");

		EIP.removeDecryptionForm($(this));

		$(this).find(".goods_info").html($.t("loading"));
		$("#dgs_quantity_change_current_quantity, #dgs_price_change_current_price, #dgs_quantity_change_quantity, #dgs_price_change_price").val("0");
	});

	$(".dgs_search").on("submit", function(e) {
		e.preventDefault();

		var seller = $.trim($(this).find("input[name=q]").val());

		$(".dgs_search input[name=q]").val(seller);

		if (seller == "") {
			EIP.pages.dgs_search();
		} else if (/^(EFT\-)/i.test(seller)) {
			var address = new EftAddress();

			if (!address.set(seller)) {
				$.growl($.t("error_invalid_seller"), {
					"type": "danger"
				});
			} else {
				EIP.pages.dgs_search();
			}
		} else {
			$.growl($.t("error_invalid_seller"), {
				"type": "danger"
			});
		}
	});

	$("#dgs_clear_results").on("click", function(e) {
		e.preventDefault();

		$(".dgs_search input[name=q]").val("").trigger("unmask").mask("EFT-****-****-****-*****", {
			"unmask": false
		});

		EIP.pages.dgs_search();
	});

	$("#user_info_modal").on("click", "a[data-goto-goods]", function(e) {
		e.preventDefault();

		var $visible_modal = $(".modal.in");

		if ($visible_modal.length) {
			$visible_modal.modal("hide");
		}

		EIP.goToGoods($(this).data("seller"), $(this).data("goto-goods"));
	});

	EIP.goToGoods = function(seller, goods) {
		$(".dgs_search input[name=q]").val(seller);

		EIP.goToPage("dgs_search", function() {
			_goodsToShow = goods;
			$("#dgs_purchase_modal").modal("show");
		});
	}

	return EIP;
}(EIP || {}, jQuery));