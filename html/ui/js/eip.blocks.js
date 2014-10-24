/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.blocksPageType = null;
	EIP.tempBlocks = [];
	var trackBlockchain = false;

	EIP.getBlock = function(blockID, callback, pageRequest) {
		EIP.sendRequest("getBlock" + (pageRequest ? "+" : ""), {
			"block": blockID
		}, function(response) {
			if (response.errorCode && response.errorCode == -1) {
				EIP.getBlock(blockID, callback, pageRequest);
			} else {
				if (callback) {
					response.block = blockID;
					callback(response);
				}
			}
		}, true);
	}

	EIP.handleInitialBlocks = function(response) {
		if (response.errorCode) {
			EIP.dataLoadFinished($("#dashboard_blocks_table"));
			return;
		}

		EIP.blocks.push(response);

		if (EIP.blocks.length < 10 && response.previousBlock) {
			EIP.getBlock(response.previousBlock, EIP.handleInitialBlocks);
		} else {
			EIP.checkBlockHeight(EIP.blocks[0].height);

			if (EIP.state) {
				//if no new blocks in 6 hours, show blockchain download progress..
				var timeDiff = EIP.state.time - EIP.blocks[0].timestamp;
				if (timeDiff > 60 * 60 * 18) {
					if (timeDiff > 60 * 60 * 24 * 14) {
						EIP.setStateInterval(30);
					} else if (timeDiff > 60 * 60 * 24 * 7) {
						//second to last week
						EIP.setStateInterval(15);
					} else {
						//last week
						EIP.setStateInterval(10);
					}
					EIP.downloadingBlockchain = true;
					$("#eip_update_explanation span").hide();
					$("#eip_update_explanation_wait").attr("style", "display: none !important");
					$("#downloading_blockchain, #eip_update_explanation_blockchain_sync").show();
					$("#show_console").hide();
					EIP.updateBlockchainDownloadProgress();
				} else {
					//continue with faster state intervals if we still haven't reached current block from within 1 hour
					if (timeDiff < 60 * 60) {
						EIP.setStateInterval(30);
						trackBlockchain = false;
					} else {
						EIP.setStateInterval(10);
						trackBlockchain = true;
					}
				}
			}

			var rows = "";

			for (var i = 0; i < EIP.blocks.length; i++) {
				var block = EIP.blocks[i];

				rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td data-timestamp='" + String(block.timestamp).escapeHTML() + "'>" + EIP.formatTimestamp(block.timestamp) + "</td><td>" + EIP.formatAmount(block.totalAmountNQT) + " + " + EIP.formatAmount(block.totalFeeNQT) + "</td><td>" + EIP.formatAmount(block.numberOfTransactions) + "</td></tr>";
			}

			$("#dashboard_blocks_table tbody").empty().append(rows);
			EIP.dataLoadFinished($("#dashboard_blocks_table"));
		}
	}

	EIP.handleNewBlocks = function(response) {
		if (EIP.downloadingBlockchain) {
			//new round started...
			if (EIP.tempBlocks.length == 0 && EIP.state.lastBlock != response.block) {
				return;
			}
		}

		//we have all blocks 	
		if (response.height - 1 == EIP.lastBlockHeight || EIP.tempBlocks.length == 99) {
			var newBlocks = [];

			//there was only 1 new block (response)
			if (EIP.tempBlocks.length == 0) {
				//remove oldest block, add newest block
				EIP.blocks.unshift(response);
				newBlocks.push(response);
			} else {
				EIP.tempBlocks.push(response);
				//remove oldest blocks, add newest blocks
				[].unshift.apply(EIP.blocks, EIP.tempBlocks);
				newBlocks = EIP.tempBlocks;
				EIP.tempBlocks = [];
			}

			if (EIP.blocks.length > 100) {
				EIP.blocks = EIP.blocks.slice(0, 100);
			}

			EIP.checkBlockHeight(EIP.blocks[0].height);

			EIP.incoming.updateDashboardBlocks(newBlocks);
		} else {
			EIP.tempBlocks.push(response);
			EIP.getBlock(response.previousBlock, EIP.handleNewBlocks);
		}
	}

	EIP.checkBlockHeight = function(blockHeight) {
		if (blockHeight) {
			EIP.lastBlockHeight = blockHeight;
		}

		if (!EIP.dgsBlockPassed) {
			if ((!EIP.isTestNet && (EIP.lastBlockHeight >= 5 || (EIP.downloadingBlockchain && EIP.state.lastBlockchainFeederHeight >= 5))) || (EIP.isTestNet && EIP.lastBlockHeight >= 5)) {
				EIP.dgsBlockPassed = true;
				$(".dgs_block").not(".advanced, .optional_message, .optional_note").show();
			}
		}
		if (!EIP.PKAnnouncementBlockPassed) {
			if ((!EIP.isTestNet && (EIP.lastBlockHeight >= 5 || (EIP.downloadingBlockchain && EIP.state.lastBlockchainFeederHeight >= 5))) || (EIP.isTestNet && EIP.lastBlockHeight >= 5)) {
				EIP.PKAnnouncementBlockPassed = true;
			}
		}
	}

	//we always update the dashboard page..
	EIP.incoming.updateDashboardBlocks = function(newBlocks) {
		var newBlockCount = newBlocks.length;

		if (newBlockCount > 10) {
			newBlocks = newBlocks.slice(0, 10);
			newBlockCount = newBlocks.length;
		}

		if (EIP.downloadingBlockchain) {
			if (EIP.state) {
				var timeDiff = EIP.state.time - EIP.blocks[0].timestamp;
				if (timeDiff < 60 * 60 * 18) {
					if (timeDiff < 60 * 60) {
						EIP.setStateInterval(30);
					} else {
						EIP.setStateInterval(10);
						trackBlockchain = true;
					}
					EIP.downloadingBlockchain = false;
					$("#dashboard_message").hide();
					$("#downloading_blockchain, #eip_update_explanation_blockchain_sync").hide();
					$("#eip_update_explanation_wait").removeAttr("style");
					if (EIP.settings["console_log"] && !EIP.inApp) {
						$("#show_console").show();
					}
					$.growl($.t("success_blockchain_up_to_date"), {
						"type": "success"
					});
					EIP.checkAliasVersions();
					EIP.checkIfOnAFork();
				} else {
					if (timeDiff > 60 * 60 * 24 * 14) {
						EIP.setStateInterval(30);
					} else if (timeDiff > 60 * 60 * 24 * 7) {
						//second to last week
						EIP.setStateInterval(15);
					} else {
						//last week
						EIP.setStateInterval(10);
					}

					EIP.updateBlockchainDownloadProgress();
				}
			}
		} else if (trackBlockchain) {
			var timeDiff = EIP.state.time - EIP.blocks[0].timestamp;

			//continue with faster state intervals if we still haven't reached current block from within 1 hour
			if (timeDiff < 60 * 60) {
				EIP.setStateInterval(30);
				trackBlockchain = false;
			} else {
				EIP.setStateInterval(10);
			}
		}

		var rows = "";

		for (var i = 0; i < newBlockCount; i++) {
			var block = newBlocks[i];

			rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td data-timestamp='" + String(block.timestamp).escapeHTML() + "'>" + EIP.formatTimestamp(block.timestamp) + "</td><td>" + EIP.formatAmount(block.totalAmountNQT) + " + " + EIP.formatAmount(block.totalFeeNQT) + "</td><td>" + EIP.formatAmount(block.numberOfTransactions) + "</td></tr>";
		}

		if (newBlockCount == 1) {
			$("#dashboard_blocks_table tbody tr:last").remove();
		} else if (newBlockCount == 10) {
			$("#dashboard_blocks_table tbody").empty();
		} else {
			$("#dashboard_blocks_table tbody tr").slice(10 - newBlockCount).remove();
		}

		$("#dashboard_blocks_table tbody").prepend(rows);

		//update number of confirmations... perhaps we should also update it in tne EIP.transactions array
		$("#dashboard_transactions_table tr.confirmed td.confirmations").each(function() {
			if ($(this).data("incoming")) {
				$(this).removeData("incoming");
				return true;
			}

			var confirmations = parseInt($(this).data("confirmations"), 10);

			var nrConfirmations = confirmations + newBlocks.length;

			if (confirmations <= 10) {
				$(this).data("confirmations", nrConfirmations);
				$(this).attr("data-content", $.t("x_confirmations", {
					"x": EIP.formatAmount(nrConfirmations, false, true)
				}));

				if (nrConfirmations > 10) {
					nrConfirmations = '10+';
				}
				$(this).html(nrConfirmations);
			} else {
				$(this).attr("data-content", $.t("x_confirmations", {
					"x": EIP.formatAmount(nrConfirmations, false, true)
				}));
			}
		});
	}

	EIP.pages.blocks = function() {
		if (EIP.blocksPageType == "forged_blocks") {
			$("#forged_fees_total_box, #forged_blocks_total_box").show();
			$("#blocks_transactions_per_hour_box, #blocks_generation_time_box").hide();

			EIP.sendRequest("getAccountBlockIds+", {
				"account": EIP.account,
				"timestamp": 0
			}, function(response) {
				if (response.blockIds && response.blockIds.length) {
					var blocks = [];
					var nrBlocks = 0;

					var blockIds = response.blockIds.reverse().slice(0, 100);

					if (response.blockIds.length > 100) {
						$("#blocks_page_forged_warning").show();
					}

					for (var i = 0; i < blockIds.length; i++) {
						EIP.sendRequest("getBlock+", {
							"block": blockIds[i],
							"_extra": {
								"nr": i
							}
						}, function(block, input) {
							if (EIP.currentPage != "blocks") {
								blocks = {};
								return;
							}

							block["block"] = input.block;
							blocks[input["_extra"].nr] = block;
							nrBlocks++;

							if (nrBlocks == blockIds.length) {
								EIP.blocksPageLoaded(blocks);
							}
						});
					}
				} else {
					EIP.blocksPageLoaded([]);
				}
			});
		} else {
			$("#forged_fees_total_box, #forged_blocks_total_box").hide();
			$("#blocks_transactions_per_hour_box, #blocks_generation_time_box").show();

			if (EIP.blocks.length < 100) {
				if (EIP.downloadingBlockchain) {
					EIP.blocksPageLoaded(EIP.blocks);
				} else {
					if (EIP.blocks && EIP.blocks.length) {
						var previousBlock = EIP.blocks[EIP.blocks.length - 1].previousBlock;
						//if previous block is undefined, dont try add it
						if (typeof previousBlock !== "undefined") {
							EIP.getBlock(previousBlock, EIP.finish100Blocks, true);
						}
					} else {
						EIP.blocksPageLoaded([]);
					}
				}
			} else {
				EIP.blocksPageLoaded(EIP.blocks);
			}
		}
	}

	EIP.incoming.blocks = function() {
		EIP.loadPage("blocks");
	}

	EIP.finish100Blocks = function(response) {
		EIP.blocks.push(response);
		if (EIP.blocks.length < 100 && typeof response.previousBlock !== "undefined") {
			EIP.getBlock(response.previousBlock, EIP.finish100Blocks, true);
		} else {
			EIP.blocksPageLoaded(EIP.blocks);
		}
	}

	EIP.blocksPageLoaded = function(blocks) {
		var rows = "";
		var totalAmount = new BigInteger("0");
		var totalFees = new BigInteger("0");
		var totalTransactions = 0;

		for (var i = 0; i < blocks.length; i++) {
			var block = blocks[i];

			totalAmount = totalAmount.add(new BigInteger(block.totalAmountNQT));

			totalFees = totalFees.add(new BigInteger(block.totalFeeNQT));

			totalTransactions += block.numberOfTransactions;

			rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td>" + EIP.formatTimestamp(block.timestamp) + "</td><td>" + EIP.formatAmount(block.totalAmountNQT) + "</td><td>" + EIP.formatAmount(block.totalFeeNQT) + "</td><td>" + EIP.formatAmount(block.numberOfTransactions) + "</td><td>" + (block.generator != EIP.genesis ? "<a href='#' data-user='" + EIP.getAccountFormatted(block, "generator") + "' class='user_info'>" + EIP.getAccountTitle(block, "generator") + "</a>" : $.t("genesis")) + "</td><td>" + EIP.formatVolume(block.payloadLength) + "</td><td>" + Math.round(block.baseTarget / 153722867 * 100).pad(4) + " %</td></tr>";
		}

		if (blocks.length) {
			var startingTime = blocks[blocks.length - 1].timestamp;
			var endingTime = blocks[0].timestamp;
			var time = endingTime - startingTime;
		} else {
			var startingTime = endingTime = time = 0;
		}

		if (blocks.length) {
			var averageFee = new Big(totalFees.toString()).div(new Big("100000000")).div(new Big(String(blocks.length))).toFixed(2);
			var averageAmount = new Big(totalAmount.toString()).div(new Big("100000000")).div(new Big(String(blocks.length))).toFixed(2);
		} else {
			var averageFee = 0;
			var averageAmount = 0;
		}

		averageFee = EIP.convertToNQT(averageFee);
		averageAmount = EIP.convertToNQT(averageAmount);

		$("#blocks_average_fee").html(EIP.formatStyledAmount(averageFee)).removeClass("loading_dots");
		$("#blocks_average_amount").html(EIP.formatStyledAmount(averageAmount)).removeClass("loading_dots");

		if (EIP.blocksPageType == "forged_blocks") {
			if (blocks.length == 100) {
				var blockCount = blocks.length + "+";
			} else {
				var blockCount = blocks.length;
			}

			$("#forged_blocks_total").html(blockCount).removeClass("loading_dots");
			$("#forged_fees_total").html(EIP.formatStyledAmount(EIP.accountInfo.forgedBalanceNQT)).removeClass("loading_dots");
		} else {
			if (time == 0) {
				$("#blocks_transactions_per_hour").html("0").removeClass("loading_dots");
			} else {
				$("#blocks_transactions_per_hour").html(Math.round(totalTransactions / (time / 60) * 60)).removeClass("loading_dots");
			}
			$("#blocks_average_generation_time").html(Math.round(time / 100) + "s").removeClass("loading_dots");
		}

		EIP.dataLoaded(rows);
	}

	$("#blocks_page_type .btn").click(function(e) {
		//	$("#blocks_page_type li a").click(function(e) {
		e.preventDefault();

		EIP.blocksPageType = $(this).data("type");

		$("#blocks_average_amount, #blocks_average_fee, #blocks_transactions_per_hour, #blocks_average_generation_time, #forged_blocks_total, #forged_fees_total").html("<span>.</span><span>.</span><span>.</span></span>").addClass("loading_dots");
		$("#blocks_table tbody").empty();
		$("#blocks_table").parent().addClass("data-loading").removeClass("data-empty");

		EIP.loadPage("blocks");
	});

	$("#goto_forged_blocks").click(function(e) {
		e.preventDefault();

		$("#blocks_page_type").find(".btn:last").button("toggle");
		EIP.blocksPageType = "forged_blocks";
		EIP.goToPage("blocks");
	});

	return EIP;
}(EIP || {}, jQuery));