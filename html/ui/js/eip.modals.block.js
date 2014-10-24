/**
 * @depends {eip.js}
 * @depends {eip.modals.js}
 */
var EIP = (function(EIP, $, undefined) {
	$("#blocks_table, #dashboard_blocks_table").on("click", "a[data-block]", function(event) {
		event.preventDefault();

		if (EIP.fetchingModalData) {
			return;
		}

		EIP.fetchingModalData = true;

		var blockHeight = $(this).data("block");

		var block = $(EIP.blocks).filter(function() {
			return parseInt(this.height) == parseInt(blockHeight);
		}).get(0);

		if (!block) {
			EIP.getBlock($(this).data("blockid"), function(response) {
				EIP.showBlockModal(response);
			});
		} else {
			EIP.showBlockModal(block);
		}
	});

	EIP.showBlockModal = function(block) {
		$("#block_info_modal_block").html(String(block.block).escapeHTML());

		$("#block_info_transactions_tab_link").tab("show");

		var blockDetails = $.extend({}, block);
		delete blockDetails.transactions;
		delete blockDetails.previousBlockHash;
		delete blockDetails.nextBlockHash;
		delete blockDetails.generationSignature;
		delete blockDetails.payloadHash;
		delete blockDetails.block;

		$("#block_info_details_table tbody").empty().append(EIP.createInfoTable(blockDetails));
		$("#block_info_details_table").show();

		if (block.transactions.length) {
			$("#block_info_transactions_none").hide();
			$("#block_info_transactions_table").show();

			var transactions = {};
			var nrTransactions = 0;

			for (var i = 0; i < block.transactions.length; i++) {
				EIP.sendRequest("getTransaction", {
					"transaction": block.transactions[i]
				}, function(transaction, input) {
					nrTransactions++;
					transactions[input.transaction] = transaction;

					if (nrTransactions == block.transactions.length) {
						var rows = "";

						for (var i = 0; i < nrTransactions; i++) {
							var transaction = transactions[block.transactions[i]];

							if (transaction.amountNQT) {
								transaction.amount = new BigInteger(transaction.amountNQT);
								transaction.fee = new BigInteger(transaction.feeNQT);
							}

							rows += "<tr><td>" + EIP.formatTime(transaction.timestamp) + "</td><td>" + EIP.formatAmount(transaction.amount) + "</td><td>" + EIP.formatAmount(transaction.fee) + "</td><td>" + EIP.getAccountTitle(transaction, "recipient") + "</td><td>" + EIP.getAccountTitle(transaction, "sender") + "</td></tr>";
						}

						$("#block_info_transactions_table tbody").empty().append(rows);
						$("#block_info_modal").modal("show");

						EIP.fetchingModalData = false;
					}
				});
			}
		} else {
			$("#block_info_transactions_none").show();
			$("#block_info_transactions_table").hide();
			$("#block_info_modal").modal("show");

			EIP.fetchingModalData = false;
		}
	}

	return EIP;
}(EIP || {}, jQuery));