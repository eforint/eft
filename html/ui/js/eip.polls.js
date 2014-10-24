/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.pages.polls = function() {
		EIP.sendRequest("getPollIds+", function(response) {
			if (response.pollIds && response.pollIds.length) {
				var polls = {};
				var nrPolls = 0;

				for (var i = 0; i < response.pollIds.length; i++) {
					EIP.sendRequest("getTransaction+", {
						"transaction": response.pollIds[i]
					}, function(poll, input) {
						if (EIP.currentPage != "polls") {
							polls = {};
							return;
						}

						if (!poll.errorCode) {
							polls[input.transaction] = poll;
						}

						nrPolls++;

						if (nrPolls == response.pollIds.length) {
							var rows = "";

							if (EIP.unconfirmedTransactions.length) {
								for (var i = 0; i < EIP.unconfirmedTransactions.length; i++) {
									var unconfirmedTransaction = EIP.unconfirmedTransactions[i];

									if (unconfirmedTransaction.type == 1 && unconfirmedTransaction.subType == 2) {
										var pollDescription = String(unconfirmedTransaction.attachment.description);

										if (pollDescription.length > 100) {
											pollDescription = pollDescription.substring(0, 100) + "...";
										}

										rows += "<tr class='tentative'><td>" + String(unconfirmedTransaction.attachment.name).escapeHTML() + "</td><td>" + pollDescription.escapeHTML() + "</td><td>" + (unconfirmedTransaction.sender != EIP.genesis ? "<a href='#' data-user='" + EIP.getAccountFormatted(unconfirmedTransaction, "sender") + "' class='user_info'>" + EIP.getAccountTitle(unconfirmedTransaction, "sender") + "</a>" : "Genesis") + "</td><td>" + EIP.formatTimestamp(unconfirmedTransaction.timestamp) + "</td><td><a href='#'>Vote (todo)</td></tr>";
									}
								}
							}

							for (var i = 0; i < nrPolls; i++) {
								var poll = polls[response.pollIds[i]];

								if (!poll) {
									continue;
								}

								var pollDescription = String(poll.attachment.description);

								if (pollDescription.length > 100) {
									pollDescription = pollDescription.substring(0, 100) + "...";
								}

								rows += "<tr><td>" + String(poll.attachment.name).escapeHTML() + "</td><td>" + pollDescription.escapeHTML() + "</td><td>" + (poll.sender != EIP.genesis ? "<a href='#' data-user='" + EIP.getAccountFormatted(poll, "sender") + "' class='user_info'>" + EIP.getAccountTitle(poll, "sender") + "</a>" : "Genesis") + "</td><td>" + EIP.formatTimestamp(poll.timestamp) + "</td><td><a href='#'>Vote (todo)</td></tr>";
							}

							EIP.dataLoaded(rows);
						}
					});
				}
			} else {
				EIP.dataLoaded();
			}
		});
	}

	EIP.incoming.polls = function() {
		EIP.loadPage("polls");
	}

	$("#create_poll_answers").on("click", "button.btn.remove_answer", function(e) {
		e.preventDefault();

		if ($("#create_poll_answers > .form-group").length == 1) {
			return;
		}

		$(this).closest("div.form-group").remove();
	});

	$("#create_poll_answers_add").click(function(e) {
		var $clone = $("#create_poll_answers > .form-group").first().clone();

		$clone.find("input").val("");

		$clone.appendTo("#create_poll_answers");
	});

	EIP.forms.createPoll = function($modal) {
		var options = new Array();

		$("#create_poll_answers input.create_poll_answers").each(function() {
			var option = $.trim($(this).val());

			if (option) {
				options.push(option);
			}
		});

		if (!options.length) {
			//...
		}

		var data = {
			"name": $("#create_poll_name").val(),
			"description": $("#create_poll_description").val(),
			"optionsAreBinary": "0",
			"minNumberOfOptions": $("#create_poll_min_options").val(),
			"maxNumberOfOptions": $("#create_poll_max_options").val(),
			"feeEFT": "1",
			"deadline": "24",
			"secretPhrase": $("#create_poll_password").val()
		};

		for (var i = 0; i < options.length; i++) {
			data["option" + i] = options[i];
		}

		return {
			"requestType": "createPoll",
			"data": data
		};
	}

	EIP.forms.createPollComplete = function(response, data) {
		if (EIP.currentPage == "polls") {
			var $table = $("#polls_table tbody");

			var date = new Date(Date.UTC(2014, 9, 23, 12, 0, 0, 0)).getTime();

			var now = parseInt(((new Date().getTime()) - date) / 1000, 10);

			var rowToAdd = "<tr class='tentative'><td>" + String(data.name).escapeHTML() + " - <strong>" + $.t("pending") + "</strong></td><td>" + String(data.description).escapeHTML() + "</td><td><a href='#' data-user='" + EIP.getAccountFormatted(EIP.accountRS) + "' class='user_info'>" + EIP.getAccountTitle(EIP.accountRS) + "</a></td><td>" + EIP.formatTimestamp(now) + "</td><td>/</td></tr>";

			$table.prepend(rowToAdd);

			if ($("#polls_table").parent().hasClass("data-empty")) {
				$("#polls_table").parent().removeClass("data-empty");
			}
		}
	}

	EIP.forms.castVote = function($modal) {

	}

	return EIP;
}(EIP || {}, jQuery));