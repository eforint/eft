/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.automaticallyCheckRecipient = function() {
		var $recipientFields = $("#send_money_recipient, #transfer_asset_recipient, #send_message_recipient, #add_contact_account_id, #update_contact_account_id, #lease_balance_recipient, #transfer_alias_recipient, #sell_alias_recipient");

		$recipientFields.on("blur", function() {
			$(this).trigger("checkRecipient");
		});

		$recipientFields.on("checkRecipient", function() {
			var value = $(this).val();
			var modal = $(this).closest(".modal");

			if (value && value != "EFT-____-____-____-_____") {
				EIP.checkRecipient(value, modal);
			} else {
				modal.find(".account_info").hide();
			}
		});

		$recipientFields.on("oldRecipientPaste", function() {
			var modal = $(this).closest(".modal");

			var callout = modal.find(".account_info").first();

			callout.removeClass("callout-info callout-danger callout-warning").addClass("callout-danger").html($.t("error_numeric_ids_not_allowed")).show();
		});
	}

	$("#send_message_modal, #send_money_modal, #add_contact_modal").on("show.bs.modal", function(e) {
		var $invoker = $(e.relatedTarget);

		var account = $invoker.data("account");

		if (!account) {
			account = $invoker.data("contact");
		}

		if (account) {
			var $inputField = $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]");

			if (!/EFT\-/i.test(account)) {
				$inputField.addClass("noMask");
			}

			$inputField.val(account).trigger("checkRecipient");
		}
	});

	$("#send_money_amount").on("input", function(e) {
		var amount = parseInt($(this).val(), 10);
		var fee = isNaN(amount) ? 1 : (amount < 500 ? 1 : Math.round(amount / 1000));

		$("#send_money_fee").val(fee);

		$(this).closest(".modal").find(".advanced_fee").html(EIP.formatAmount(EIP.convertToNQT(fee)) + " EFT");
	});

	//todo later: http://twitter.github.io/typeahead.js/
	$("span.recipient_selector button").on("click", function(e) {
		if (!Object.keys(EIP.contacts).length) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		var $list = $(this).parent().find("ul");

		$list.empty();

		for (var accountId in EIP.contacts) {
			$list.append("<li><a href='#' data-contact='" + String(EIP.contacts[accountId].name).escapeHTML() + "'>" + String(EIP.contacts[accountId].name).escapeHTML() + "</a></li>");
		}
	});

	$("span.recipient_selector").on("click", "ul li a", function(e) {
		e.preventDefault();
		$(this).closest("form").find("input[name=converted_account_id]").val("");
		$(this).closest("form").find("input[name=recipient],input[name=account_id]").not("[type=hidden]").trigger("unmask").val($(this).data("contact")).trigger("blur");
	});

	EIP.forms.sendMoneyComplete = function(response, data) {
		if (!(data["_extra"] && data["_extra"].convertedAccount) && !(data.recipient in EIP.contacts)) {
			$.growl($.t("success_send_money") + " <a href='#' data-account='" + EIP.getAccountFormatted(data, "recipient") + "' data-toggle='modal' data-target='#add_contact_modal' style='text-decoration:underline'>" + $.t("add_recipient_to_contacts_q") + "</a>", {
				"type": "success"
			});
		} else {
			$.growl($.t("success_send_money"), {
				"type": "success"
			});
		}
	}

	EIP.sendMoneyShowAccountInformation = function(accountId) {
		EIP.getAccountError(accountId, function(response) {
			if (response.type == "success") {
				$("#send_money_account_info").hide();
			} else {
				$("#send_money_account_info").html(response.message).show();

			}
		});
	}

	EIP.getAccountError = function(accountId, callback) {
		EIP.sendRequest("getAccount", {
			"account": accountId
		}, function(response) {
			if (response.publicKey) {
				callback({
					"type": "info",
					"message": $.t("recipient_info", {
						"eft": EIP.formatAmount(response.unconfirmedBalanceNQT, false, true)
					}),
					"account": response
				});
			} else {
				if (response.errorCode) {
					if (response.errorCode == 4) {
						callback({
							"type": "danger",
							"message": $.t("recipient_malformed") + (!/^(EFT\-)/i.test(accountId) ? " " + $.t("recipient_alias_suggestion") : ""),
							"account": null
						});
					} else if (response.errorCode == 5) {
						callback({
							"type": "warning",
							"message": $.t("recipient_unknown" + (EIP.PKAnnouncementBlockPassed ? "_pka" : "")),
							"account": null,
							"noPublicKey": true
						});
					} else {
						callback({
							"type": "danger",
							"message": $.t("recipient_problem") + " " + String(response.errorDescription).escapeHTML(),
							"account": null
						});
					}
				} else {
					callback({
						"type": "warning",
						"message": $.t("recipient_no_public_key" + (EIP.PKAnnouncementBlockPassed ? "_pka" : ""), {
							"eft": EIP.formatAmount(response.unconfirmedBalanceNQT, false, true)
						}),
						"account": response,
						"noPublicKey": true
					});
				}
			}
		});
	}

	EIP.correctAddressMistake = function(el) {
		$(el).closest(".modal-body").find("input[name=recipient],input[name=account_id]").val($(el).data("address")).trigger("blur");
	}

	EIP.checkRecipient = function(account, modal) {
		var classes = "callout-info callout-danger callout-warning";

		var callout = modal.find(".account_info").first();
		var accountInputField = modal.find("input[name=converted_account_id]");
		var recipientPublicKeyField = modal.find("input[name=recipientPublicKey]");

		accountInputField.val("");

		account = $.trim(account);

		//solomon reed. Btw, this regex can be shortened..
		if (/^(EFT\-)?[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+/i.test(account)) {
			var address = new EftAddress();

			if (address.set(account)) {
				EIP.getAccountError(account, function(response) {
					if (EIP.PKAnnouncementBlockPassed) {
						if (response.noPublicKey) {
							modal.find(".recipient_public_key").show();
						} else {
							modal.find("input[name=recipientPublicKey]").val("");
							modal.find(".recipient_public_key").hide();
						}
					}

					var message = response.message.escapeHTML();

					callout.removeClass(classes).addClass("callout-" + response.type).html(message).show();
				});
			} else {
				if (address.guess.length == 1) {
					callout.removeClass(classes).addClass("callout-danger").html($.t("recipient_malformed_suggestion", {
						"recipient": "<span class='malformed_address' data-address='" + String(address.guess[0]).escapeHTML() + "' onclick='EIP.correctAddressMistake(this);'>" + address.format_guess(address.guess[0], account) + "</span>"
					})).show();
				} else if (address.guess.length > 1) {
					var html = $.t("recipient_malformed_suggestion", {
						"count": address.guess.length
					}) + "<ul>";
					for (var i = 0; i < address.guess.length; i++) {
						html += "<li><span clas='malformed_address' data-address='" + String(address.guess[i]).escapeHTML() + "' onclick='EIP.correctAddressMistake(this);'>" + address.format_guess(address.guess[i], account) + "</span></li>";
					}

					callout.removeClass(classes).addClass("callout-danger").html(html).show();
				} else {
					callout.removeClass(classes).addClass("callout-danger").html($.t("recipient_malformed")).show();
				}
			}
		} else if (!(/^\d+$/.test(account))) {
			if (EIP.databaseSupport && account.charAt(0) != '@') {
				EIP.database.select("contacts", [{
					"name": account
				}], function(error, contact) {
					if (!error && contact.length) {
						contact = contact[0];
						EIP.getAccountError(contact.accountRS, function(response) {
							callout.removeClass(classes).addClass("callout-" + response.type).html($.t("contact_account_link", {
								"account_id": EIP.getAccountFormatted(contact, "account")
							}) + " " + response.message.escapeHTML()).show();

							if (response.type == "info" || response.type == "warning") {
								accountInputField.val(contact.accountRS);
							}
						});
					} else if (/^[a-z0-9]+$/i.test(account)) {
						EIP.checkRecipientAlias(account, modal);
					} else {
						callout.removeClass(classes).addClass("callout-danger").html($.t("recipient_malformed")).show();
					}
				});
			} else if (/^[a-z0-9@]+$/i.test(account)) {
				if (account.charAt(0) == '@') {
					account = account.substring(1);
					EIP.checkRecipientAlias(account, modal);
				}
			} else {
				callout.removeClass(classes).addClass("callout-danger").html($.t("recipient_malformed")).show();
			}
		} else {
			callout.removeClass(classes).addClass("callout-danger").html($.t("error_numeric_ids_not_allowed")).show();
		}
	}

	EIP.checkRecipientAlias = function(account, modal) {
		var classes = "callout-info callout-danger callout-warning";
		var callout = modal.find(".account_info").first();
		var accountInputField = modal.find("input[name=converted_account_id]");

		accountInputField.val("");

		EIP.sendRequest("getAlias", {
			"aliasName": account
		}, function(response) {
			if (response.errorCode) {
				callout.removeClass(classes).addClass("callout-danger").html($.t("error_invalid_account_id")).show();
			} else {
				if (response.aliasURI) {
					var alias = String(response.aliasURI);
					var timestamp = response.timestamp;

					var regex_1 = /acct:(.*)@eft/;
					var regex_2 = /nacc:(.*)/;

					var match = alias.match(regex_1);

					if (!match) {
						match = alias.match(regex_2);
					}

					if (match && match[1]) {
						match[1] = String(match[1]).toUpperCase();

						if (/^\d+$/.test(match[1])) {
							var address = new EftAddress();

							if (address.set(match[1])) {
								match[1] = address.toString();
							} else {
								accountInputField.val("");
								callout.html("Invalid account alias.");
							}
						}

						//TODO fix
						EIP.getAccountError(match[1], function(response) {
							accountInputField.val(match[1].escapeHTML());
							callout.html($.t("alias_account_link", {
								"account_id": String(match[1]).escapeHTMl()
							}) + ", " + response.message.replace("The recipient account", "which") + " " + $.t("alias_account_link", {
								"timestamp": EIP.formatTimestamp(timestamp)
							})).removeClass(classes).addClass("callout-" + response.type).show();
						});
					} else {
						callout.removeClass(classes).addClass("callout-danger").html($.t("alias_account_no_link") + (!alias ? $.t("error_uri_empty") : $.t("uri_is", {
							"uri": String(alias).escapeHTML()
						}))).show();
					}
				} else if (response.aliasName) {
					callout.removeClass(classes).addClass("callout-danger").html($.t("error_alias_empty_uri")).show();
				} else {
					callout.removeClass(classes).addClass("callout-danger").html(response.errorDescription ? $.t("error") + ": " + String(response.errorDescription).escapeHTML() : $.t("error_alias")).show();
				}
			}
		});
	}

	return EIP;
}(EIP || {}, jQuery));