/**
 * @depends {eip.js}
 */
var EIP = (function(EIP, $, undefined) {
	EIP.normalVersion = {};
	EIP.betaVersion = {};
	EIP.isOutdated = false;

	EIP.checkAliasVersions = function() {
		if (EIP.downloadingBlockchain) {
			$("#eip_update_explanation span").hide();
			$("#eip_update_explanation_blockchain_sync").show();
			return;
		}
		if (EIP.isTestNet) {
			$("#eip_update_explanation span").hide();
			$("#eip_update_explanation_testnet").show();
			return;
		}

		//Get latest version nr+hash of normal version
		EIP.sendRequest("getAlias", {
			"aliasName": "eipversion"
		}, function(response) {
			if (response.aliasURI && (response = response.aliasURI.split(" "))) {
				EIP.normalVersion.versionNr = response[0];
				EIP.normalVersion.hash = response[1];

				if (EIP.betaVersion.versionNr) {
					EIP.checkForNewVersion();
				}
			}
		});

		//Get latest version nr+hash of beta version
		EIP.sendRequest("getAlias", {
			"aliasName": "eipbetaversion"
		}, function(response) {
			if (response.aliasURI && (response = response.aliasURI.split(" "))) {
				EIP.betaVersion.versionNr = response[0];
				EIP.betaVersion.hash = response[1];

				if (EIP.normalVersion.versionNr) {
					EIP.checkForNewVersion();
				}
			}
		});

		if (EIP.inApp) {
			if (EIP.appPlatform && EIP.appVersion) {
				EIP.sendRequest("getAlias", {
					"aliasName": "eipwallet" + EIP.appPlatform
				}, function(response) {
					var versionInfo = $.parseJSON(response.aliasURI);

					if (versionInfo && versionInfo.version != EIP.appVersion) {
						var newerVersionAvailable = EIP.versionCompare(EIP.appVersion, versionInfo.version);

						if (newerVersionAvailable == -1) {
							parent.postMessage({
								"type": "appUpdate",
								"version": versionInfo.version,
								"eip": versionInfo.eip,
								"hash": versionInfo.hash,
								"url": versionInfo.url
							}, "*");
						}
					}
				});
			} else {
				//user uses an old version which does not supply the platform / version
				var noticeDate = new Date(2015, 1, 23);

				if (new Date() > noticeDate) {
					var isMac = navigator.platform.match(/Mac/i);

					var downloadUrl = "https://bitbucket.org/wesleyh/eft-wallet-" + (isMac ? "mac" : "win") + "/downloads";

					$("#secondary_dashboard_message").removeClass("alert-success").addClass("alert-danger").html($.t("old_eft_wallet_update", {
						"link": downloadUrl
					})).show();
				}
			}
		}
	}

	EIP.checkForNewVersion = function() {
		var installVersusNormal, installVersusBeta, normalVersusBeta;

		if (EIP.normalVersion && EIP.normalVersion.versionNr) {
			installVersusNormal = EIP.versionCompare(EIP.state.version, EIP.normalVersion.versionNr);
		}
		if (EIP.betaVersion && EIP.betaVersion.versionNr) {
			installVersusBeta = EIP.versionCompare(EIP.state.version, EIP.betaVersion.versionNr);
		}

		$("#eip_update_explanation > span").hide();

		$("#eip_update_explanation_wait").attr("style", "display: none !important");

		$(".eip_new_version_nr").html(EIP.normalVersion.versionNr).show();
		$(".eip_beta_version_nr").html(EIP.betaVersion.versionNr).show();

		if (installVersusNormal == -1 && installVersusBeta == -1) {
			EIP.isOutdated = true;
			$("#eip_update").html("Outdated!").show();
			$("#eip_update_explanation_new_choice").show();
		} else if (installVersusBeta == -1) {
			EIP.isOutdated = false;
			$("#eip_update").html("New Beta").show();
			$("#eip_update_explanation_new_beta").show();
		} else if (installVersusNormal == -1) {
			EIP.isOutdated = true;
			$("#eip_update").html("Outdated!").show();
			$("#eip_update_explanation_new_release").show();
		} else {
			EIP.isOutdated = false;
			$("#eip_update_explanation_up_to_date").show();
		}
	}

	EIP.versionCompare = function(v1, v2) {
		if (v2 == undefined) {
			return -1;
		} else if (v1 == undefined) {
			return -1;
		}

		//https://gist.github.com/TheDistantSea/8021359 (based on)
		var v1last = v1.slice(-1);
		var v2last = v2.slice(-1);

		if (v1last == 'e') {
			v1 = v1.substring(0, v1.length - 1);
		} else {
			v1last = '';
		}

		if (v2last == 'e') {
			v2 = v2.substring(0, v2.length - 1);
		} else {
			v2last = '';
		}

		var v1parts = v1.split('.');
		var v2parts = v2.split('.');

		function isValidPart(x) {
			return /^\d+$/.test(x);
		}

		if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
			return NaN;
		}

		v1parts = v1parts.map(Number);
		v2parts = v2parts.map(Number);

		for (var i = 0; i < v1parts.length; ++i) {
			if (v2parts.length == i) {
				return 1;
			}
			if (v1parts[i] == v2parts[i]) {
				continue;
			} else if (v1parts[i] > v2parts[i]) {
				return 1;
			} else {
				return -1;
			}
		}

		if (v1parts.length != v2parts.length) {
			return -1;
		}

		if (v1last && v2last) {
			return 0;
		} else if (v1last) {
			return 1;
		} else if (v2last) {
			return -1;
		} else {
			return 0;
		}
	}

	EIP.supportsUpdateVerification = function() {
		if ((typeof File !== 'undefined') && !File.prototype.slice) {
			if (File.prototype.webkitSlice) {
				File.prototype.slice = File.prototype.webkitSlice;
			}

			if (File.prototype.mozSlice) {
				File.prototype.slice = File.prototype.mozSlice;
			}
		}

		// Check for the various File API support.
		if (!window.File || !window.FileReader || !window.FileList || !window.Blob || !File.prototype.slice || !window.Worker) {
			return false;
		}

		return true;
	}

	EIP.verifyClientUpdate = function(e) {
		e.stopPropagation();
		e.preventDefault();

		var files = null;

		if (e.originalEvent.target.files && e.originalEvent.target.files.length) {
			files = e.originalEvent.target.files;
		} else if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length) {
			files = e.originalEvent.dataTransfer.files;
		}

		if (!files) {
			return;
		}

		$("#eip_update_hash_progress").css("width", "0%");
		$("#eip_update_hash_progress").show();

		var worker = new Worker("js/crypto/sha256worker.js");

		worker.onmessage = function(e) {
			if (e.data.progress) {
				$("#eip_update_hash_progress").css("width", e.data.progress + "%");
			} else {
				$("#eip_update_hash_progress").hide();
				$("#eip_update_drop_zone").hide();

				if (e.data.sha256 == EIP.downloadedVersion.hash) {
					$("#eip_update_result").html($.t("success_hash_verification")).attr("class", " ");
				} else {
					$("#eip_update_result").html($.t("error_hash_verification")).attr("class", "incorrect");
				}

				$("#eip_update_hash_version").html(EIP.downloadedVersion.versionNr);
				$("#eip_update_hash_download").html(e.data.sha256);
				$("#eip_update_hash_official").html(EIP.downloadedVersion.hash);
				$("#eip_update_hashes").show();
				$("#eip_update_result").show();

				EIP.downloadedVersion = {};

				$("body").off("dragover.eip, drop.eip");
			}
		};

		worker.postMessage({
			file: files[0]
		});
	}

	EIP.downloadClientUpdate = function(version) {
		if (version == "release") {
			EIP.downloadedVersion = EIP.normalVersion;
		} else {
			EIP.downloadedVersion = EIP.betaVersion;
		}

		if (EIP.inApp) {
			parent.postMessage({
				"type": "update",
				"update": {
					"type": version,
					"version": EIP.downloadedVersion.versionNr,
					"hash": EIP.downloadedVersion.hash
				}
			}, "*");
			$("#eip_modal").modal("hide");
		} else {
			$("#eip_update_iframe").attr("src", "https://bitbucket.org/JeanLucPicard/eft/downloads/eft-client-" + EIP.downloadedVersion.versionNr + ".zip");
			$("#eip_update_explanation").hide();
			$("#eip_update_drop_zone").show();

			$("body").on("dragover.eip", function(e) {
				e.preventDefault();
				e.stopPropagation();

				if (e.originalEvent && e.originalEvent.dataTransfer) {
					e.originalEvent.dataTransfer.dropEffect = "copy";
				}
			});

			$("body").on("drop.eip", function(e) {
				EIP.verifyClientUpdate(e);
			});

			$("#eip_update_drop_zone").on("click", function(e) {
				e.preventDefault();

				$("#eip_update_file_select").trigger("click");

			});

			$("#eip_update_file_select").on("change", function(e) {
				EIP.verifyClientUpdate(e);
			});
		}

		return false;
	}

	return EIP;
}(EIP || {}, jQuery));