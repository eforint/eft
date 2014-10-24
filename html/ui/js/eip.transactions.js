/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.lastTransactionsTimestamp = 0;
	EIP.lastTransactions = "";

	EIP.unconfirmedTransactions = [];
	EIP.unconfirmedTransactionIds = "";
	EIP.unconfirmedTransactionsChange = true;

	EIP.transactionsPageType = null;

	EIP.getInitialTransactions = function() {
		EIP.sendRequest("getAccountTransactions", {
			"account": EIP.account,
			"firstIndex": 0,
			"lastIndex": 10
		}, function(response) {
			if (response.transactions && response.transactions.length) {
				var transactions = [];
				var transactionIds = [];

				for (var i = 0; i < response.transactions.length; i++) {
					var transaction = response.transactions[i];

					transaction.confirmed = true;
					transactions.push(transaction);

					transactionIds.push(transaction.transaction);
				}

				EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
					EIP.handleInitialTransactions(transactions.concat(unconfirmedTransactions), transactionIds);
				});
			} else {
				EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
					EIP.handleInitialTransactions(unconfirmedTransactions, []);
				});
			}
		});
	}

	EIP.handleInitialTransactions = function(transactions, transactionIds) {
		if (transactions.length) {
			var rows = "";

			transactions.sort(EIP.sortArray);

			if (transactions.length >= 1) {
				EIP.lastTransactions = transactionIds.toString();

				for (var i = transactions.length - 1; i >= 0; i--) {
					if (transactions[i].confirmed) {
						EIP.lastTransactionsTimestamp = transactions[i].timestamp;
						break;
					}
				}
			}

			for (var i = 0; i < transactions.length; i++) {
				var transaction = transactions[i];

				var receiving = transaction.recipient == EIP.account;

				var account = (receiving ? "sender" : "recipient");

				if (transaction.amountNQT) {
					transaction.amount = new BigInteger(transaction.amountNQT);
					transaction.fee = new BigInteger(transaction.feeNQT);
				}

				rows += "<tr class='" + (!transaction.confirmed ? "tentative" : "confirmed") + "'><td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "' data-timestamp='" + String(transaction.timestamp).escapeHTML() + "'>" + EIP.formatTimestamp(transaction.timestamp) + "</a></td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td><span" + (transaction.type == 0 && receiving ? " style='color:#006400'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + EIP.formatAmount(transaction.amount) + "</span> <span" + ((!receiving && transaction.type == 0) ? " style='color:red'" : "") + ">+</span> <span" + (!receiving ? " style='color:red'" : "") + ">" + EIP.formatAmount(transaction.fee) + "</span></td><td>" + EIP.getAccountLink(transaction, account) + "</td><td class='confirmations' data-confirmations='" + String(transaction.confirmations).escapeHTML() + "' data-content='" + EIP.formatAmount(transaction.confirmations) + " confirmations' data-container='body' data-initial='true'>" + (transaction.confirmations > 10 ? "10+" : String(transaction.confirmations).escapeHTML()) + "</td></tr>";
			}

			$("#dashboard_transactions_table tbody").empty().append(rows);
		}

		EIP.dataLoadFinished($("#dashboard_transactions_table"));
	}

	EIP.getNewTransactions = function() {
		EIP.sendRequest("getAccountTransactionIds", {
			"account": EIP.account,
			"timestamp": EIP.lastTransactionsTimestamp
		}, function(response) {
			if (response.transactionIds && response.transactionIds.length) {
				var transactionIds = response.transactionIds.slice(0, 10);

				if (transactionIds.toString() == EIP.lastTransactions) {
					EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
						EIP.handleIncomingTransactions(unconfirmedTransactions);
					});
					return;
				}

				EIP.transactionIds = transactionIds;

				var nrTransactions = 0;

				var newTransactions = [];

				//if we have a new transaction, we just get them all.. (10 max)
				for (var i = 0; i < transactionIds.length; i++) {
					EIP.sendRequest("getTransaction", {
						"transaction": transactionIds[i]
					}, function(transaction, input) {
						nrTransactions++;

						transaction.transaction = input.transaction;
						transaction.confirmed = true;
						newTransactions.push(transaction);

						if (nrTransactions == transactionIds.length) {
							EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
								EIP.handleIncomingTransactions(newTransactions.concat(unconfirmedTransactions), transactionIds);
							});
						}
					});
				}
			} else {
				EIP.getUnconfirmedTransactions(function(unconfirmedTransactions) {
					EIP.handleIncomingTransactions(unconfirmedTransactions);
				});
			}
		});
	}

	EIP.getUnconfirmedTransactions = function(callback) {
		EIP.sendRequest("getUnconfirmedTransactions", {
			"account": EIP.account
		}, function(response) {
			if (response.unconfirmedTransactions && response.unconfirmedTransactions.length) {
				var unconfirmedTransactions = [];
				var unconfirmedTransactionIds = [];

				response.unconfirmedTransactions.sort(function(x, y) {
					if (x.timestamp < y.timestamp) {
						return 1;
					} else if (x.timestamp > y.timestamp) {
						return -1;
					} else {
						return 0;
					}
				});

				for (var i = 0; i < response.unconfirmedTransactions.length; i++) {
					var unconfirmedTransaction = response.unconfirmedTransactions[i];

					unconfirmedTransaction.confirmed = false;
					unconfirmedTransaction.unconfirmed = true;
					unconfirmedTransaction.confirmations = "/";

					if (unconfirmedTransaction.attachment) {
						for (var key in unconfirmedTransaction.attachment) {
							if (!unconfirmedTransaction.hasOwnProperty(key)) {
								unconfirmedTransaction[key] = unconfirmedTransaction.attachment[key];
							}
						}
					}

					unconfirmedTransactions.push(unconfirmedTransaction);
					unconfirmedTransactionIds.push(unconfirmedTransaction.transaction);
				}

				EIP.unconfirmedTransactions = unconfirmedTransactions;

				var unconfirmedTransactionIdString = unconfirmedTransactionIds.toString();

				if (unconfirmedTransactionIdString != EIP.unconfirmedTransactionIds) {
					EIP.unconfirmedTransactionsChange = true;
					EIP.unconfirmedTransactionIds = unconfirmedTransactionIdString;
				} else {
					EIP.unconfirmedTransactionsChange = false;
				}

				if (callback) {
					callback(unconfirmedTransactions);
				} else if (EIP.unconfirmedTransactionsChange) {
					EIP.incoming.updateDashboardTransactions(unconfirmedTransactions, true);
				}
			} else {
				EIP.unconfirmedTransactions = [];

				if (EIP.unconfirmedTransactionIds) {
					EIP.unconfirmedTransactionsChange = true;
				} else {
					EIP.unconfirmedTransactionsChange = false;
				}

				EIP.unconfirmedTransactionIds = "";

				if (callback) {
					callback([]);
				} else if (EIP.unconfirmedTransactionsChange) {
					EIP.incoming.updateDashboardTransactions([], true);
				}
			}
		});
	}

	EIP.handleIncomingTransactions = function(transactions, confirmedTransactionIds) {
		var oldBlock = (confirmedTransactionIds === false); //we pass false instead of an [] in case there is no new block..

		if (typeof confirmedTransactionIds != "object") {
			confirmedTransactionIds = [];
		}

		if (confirmedTransactionIds.length) {
			EIP.lastTransactions = confirmedTransactionIds.toString();

			for (var i = transactions.length - 1; i >= 0; i--) {
				if (transactions[i].confirmed) {
					EIP.lastTransactionsTimestamp = transactions[i].timestamp;
					break;
				}
			}
		}

		if (confirmedTransactionIds.length || EIP.unconfirmedTransactionsChange) {
			transactions.sort(EIP.sortArray);

			EIP.incoming.updateDashboardTransactions(transactions, confirmedTransactionIds.length == 0);
		}

		//always refresh peers and unconfirmed transactions..
		if (EIP.currentPage == "peers") {
			EIP.incoming.peers();
		} else if (EIP.currentPage == "transactions" && EIP.transactionsPageType == "unconfirmed") {
			EIP.incoming.transactions();
		} else {
			if (!oldBlock || EIP.unconfirmedTransactionsChange) {
				if (EIP.incoming[EIP.currentPage]) {
					EIP.incoming[EIP.currentPage](transactions);
				}
			}
		}
	}

	EIP.sortArray = function(a, b) {
		return b.timestamp - a.timestamp;
	}

	EIP.incoming.updateDashboardTransactions = function(newTransactions, unconfirmed) {
		var newTransactionCount = newTransactions.length;

		if (newTransactionCount) {
			var rows = "";

			var onlyUnconfirmed = true;

			for (var i = 0; i < newTransactionCount; i++) {
				var transaction = newTransactions[i];

				var receiving = transaction.recipient == EIP.account;
				var account = (receiving ? "sender" : "recipient");

				if (transaction.confirmed) {
					onlyUnconfirmed = false;
				}

				if (transaction.amountNQT) {
					transaction.amount = new BigInteger(transaction.amountNQT);
					transaction.fee = new BigInteger(transaction.feeNQT);
				}

				rows += "<tr class='" + (!transaction.confirmed ? "tentative" : "confirmed") + "'><td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "' data-timestamp='" + String(transaction.timestamp).escapeHTML() + "'>" + EIP.formatTimestamp(transaction.timestamp) + "</a></td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td><span" + (transaction.type == 0 && receiving ? " style='color:#006400'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + EIP.formatAmount(transaction.amount) + "</span> <span" + ((!receiving && transaction.type == 0) ? " style='color:red'" : "") + ">+</span> <span" + (!receiving ? " style='color:red'" : "") + ">" + EIP.formatAmount(transaction.fee) + "</span></td><td>" + EIP.getAccountLink(transaction, account) + "</td><td class='confirmations' data-confirmations='" + String(transaction.confirmations).escapeHTML() + "' data-content='" + (transaction.confirmed ? EIP.formatAmount(transaction.confirmations) + " " + $.t("confirmations") : $.t("unconfirmed_transaction")) + "' data-container='body' data-initial='true'>" + (transaction.confirmations > 10 ? "10+" : String(transaction.confirmations).escapeHTML()) + "</td></tr>";
			}

			if (onlyUnconfirmed) {
				$("#dashboard_transactions_table tbody tr.tentative").remove();
				$("#dashboard_transactions_table tbody").prepend(rows);
			} else {
				$("#dashboard_transactions_table tbody").empty().append(rows);
			}

			var $parent = $("#dashboard_transactions_table").parent();

			if ($parent.hasClass("data-empty")) {
				$parent.removeClass("data-empty");
				if ($parent.data("no-padding")) {
					$parent.parent().addClass("no-padding");
				}
			}
		} else if (unconfirmed) {
			$("#dashboard_transactions_table tbody tr.tentative").remove();
		}
	}

	//todo: add to dashboard? 
	EIP.addUnconfirmedTransaction = function(transactionId, callback) {
		EIP.sendRequest("getTransaction", {
			"transaction": transactionId
		}, function(response) {
			if (!response.errorCode) {
				response.transaction = transactionId;
				response.confirmations = "/";
				response.confirmed = false;
				response.unconfirmed = true;

				if (response.attachment) {
					for (var key in response.attachment) {
						if (!response.hasOwnProperty(key)) {
							response[key] = response.attachment[key];
						}
					}
				}

				var alreadyProcessed = false;

				try {
					var regex = new RegExp("(^|,)" + transactionId + "(,|$)");

					if (regex.exec(EIP.lastTransactions)) {
						alreadyProcessed = true;
					} else {
						$.each(EIP.unconfirmedTransactions, function(key, unconfirmedTransaction) {
							if (unconfirmedTransaction.transaction == transactionId) {
								alreadyProcessed = true;
								return false;
							}
						});
					}
				} catch (e) {}

				if (!alreadyProcessed) {
					EIP.unconfirmedTransactions.unshift(response);
				}

				if (callback) {
					callback(alreadyProcessed);
				}

				EIP.incoming.updateDashboardTransactions(EIP.unconfirmedTransactions, true);

				EIP.getAccountInfo();
			} else if (callback) {
				callback(false);
			}
		});
	}

	EIP.pages.transactions = function() {
		if (EIP.transactionsPageType == "unconfirmed") {
			EIP.displayUnconfirmedTransactions();
			return;
		}

		var rows = "";

		var params = {
			"account": EIP.account,
			"firstIndex": 0,
			"lastIndex": 100
		};

		if (EIP.transactionsPageType) {
			params.type = EIP.transactionsPageType.type;
			params.subtype = EIP.transactionsPageType.subtype;
			var unconfirmedTransactions = EIP.getUnconfirmedTransactionsFromCache(params.type, params.subtype);
		} else {
			var unconfirmedTransactions = EIP.unconfirmedTransactions;
		}

		if (unconfirmedTransactions) {
			for (var i = 0; i < unconfirmedTransactions.length; i++) {
				rows += EIP.getTransactionRowHTML(unconfirmedTransactions[i]);
			}
		}

		EIP.sendRequest("getAccountTransactions+", params, function(response) {
			if (response.transactions && response.transactions.length) {
				for (var i = 0; i < response.transactions.length; i++) {
					var transaction = response.transactions[i];

					transaction.confirmed = true;

					rows += EIP.getTransactionRowHTML(transaction);
				}

				EIP.dataLoaded(rows);
			} else {
				EIP.dataLoaded(rows);
			}
		});
	}

	EIP.incoming.transactions = function(transactions) {
		EIP.loadPage("transactions");
	}

	EIP.displayUnconfirmedTransactions = function() {
		EIP.sendRequest("getUnconfirmedTransactions", function(response) {
			var rows = "";

			if (response.unconfirmedTransactions && response.unconfirmedTransactions.length) {
				for (var i = 0; i < response.unconfirmedTransactions.length; i++) {
					rows += EIP.getTransactionRowHTML(response.unconfirmedTransactions[i]);
				}
			}

			EIP.dataLoaded(rows);
		});
	}

	EIP.getTransactionRowHTML = function(transaction) {
		var transactionType = $.t("unknown");

		if (transaction.type == 0) {
			transactionType = $.t("ordinary_payment");
		} else if (transaction.type == 1) {
			switch (transaction.subtype) {
				case 0:
					transactionType = $.t("arbitrary_message");
					break;
				case 1:
					transactionType = $.t("alias_assignment");
					break;
				case 2:
					transactionType = $.t("poll_creation");
					break;
				case 3:
					transactionType = $.t("vote_casting");
					break;
				case 4:
					transactionType = $.t("hub_announcements");
					break;
				case 5:
					transactionType = $.t("account_info");
					break;
				case 6:
					if (transaction.attachment.priceNQT == "0") {
						if (transaction.sender == EIP.account && transaction.recipient == EIP.account) {
							transactionType = $.t("alias_sale_cancellation");
						} else {
							transactionType = $.t("alias_transfer");
						}
					} else {
						transactionType = $.t("alias_sale");
					}
					break;
				case 7:
					transactionType = $.t("alias_buy");
					break;
			}
		} else if (transaction.type == 2) {
			switch (transaction.subtype) {
				case 0:
					transactionType = $.t("asset_issuance");
					break;
				case 1:
					transactionType = $.t("asset_transfer");
					break;
				case 2:
					transactionType = $.t("ask_order_placement");
					break;
				case 3:
					transactionType = $.t("bid_order_placement");
					break;
				case 4:
					transactionType = $.t("ask_order_cancellation");
					break;
				case 5:
					transactionType = $.t("bid_order_cancellation");
					break;
			}
		} else if (transaction.type == 3) {
			switch (transaction.subtype) {
				case 0:
					transactionType = $.t("marketplace_listing");
					break;
				case 1:
					transactionType = $.t("marketplace_removal");
					break;
				case 2:
					transactionType = $.t("marketplace_price_change");
					break;
				case 3:
					transactionType = $.t("marketplace_quantity_change");
					break;
				case 4:
					transactionType = $.t("marketplace_purchase");
					break;
				case 5:
					transactionType = $.t("marketplace_delivery");
					break;
				case 6:
					transactionType = $.t("marketplace_feedback");
					break;
				case 7:
					transactionType = $.t("marketplace_refund");
					break;
			}
		} else if (transaction.type == 4) {
			switch (transaction.subtype) {
				case 0:
					transactionType = $.t("balance_leasing");
					break;
			}
		}

		var receiving = transaction.recipient == EIP.account;
		var account = (receiving ? "sender" : "recipient");

		if (transaction.amountNQT) {
			transaction.amount = new BigInteger(transaction.amountNQT);
			transaction.fee = new BigInteger(transaction.feeNQT);
		}

		var hasMessage = false;

		if (transaction.attachment) {
			if (transaction.attachment.encryptedMessage || transaction.attachment.message) {
				hasMessage = true;
			} else if (transaction.sender == EIP.account && transaction.attachment.encryptToSelfMessage) {
				hasMessage = true;
			}
		}

		return "<tr " + (!transaction.confirmed && (transaction.recipient == EIP.account || transaction.sender == EIP.account) ? " class='tentative'" : "") + "><td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "'>" + String(transaction.transaction).escapeHTML() + "</a></td><td>" + (hasMessage ? "<i class='fa fa-envelope-o'></i>&nbsp;" : "/") + "</td><td>" + EIP.formatTimestamp(transaction.timestamp) + "</td><td>" + transactionType + "</td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td " + (transaction.type == 0 && receiving ? " style='color:#006400;'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + EIP.formatAmount(transaction.amount) + "</td><td " + (!receiving ? " style='color:red'" : "") + ">" + EIP.formatAmount(transaction.fee) + "</td><td>" + EIP.getAccountLink(transaction, account) + "</td><td class='confirmations' data-content='" + (transaction.confirmed ? EIP.formatAmount(transaction.confirmations) + " " + $.t("confirmations") : $.t("unconfirmed_transaction")) + "' data-container='body' data-placement='left'>" + (!transaction.confirmed ? "/" : (transaction.confirmations > 1440 ? "1440+" : EIP.formatAmount(transaction.confirmations))) + "</td></tr>";
	}

	$("#transactions_page_type li a").click(function(e) {
		e.preventDefault();

		var type = $(this).data("type");

		if (!type) {
			EIP.transactionsPageType = null;
		} else if (type == "unconfirmed") {
			EIP.transactionsPageType = "unconfirmed";
		} else {
			type = type.split(":");
			EIP.transactionsPageType = {
				"type": type[0],
				"subtype": type[1]
			};
		}

		$(this).parents(".btn-group").find(".text").text($(this).text());

		$(".popover").remove();

		EIP.loadPage("transactions");
	});

	return EIP;
}(EIP || {}, jQuery));