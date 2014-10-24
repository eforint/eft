package eft.http;

import eft.Account;
import eft.Asset;
import eft.Attachment;
import eft.Constants;
import eft.EftException;
import eft.util.Convert;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_ASSET_TRANSFER_COMMENT;
import static eft.http.JSONResponses.NOT_ENOUGH_ASSETS;

public final class TransferAsset extends CreateTransaction {

    static final TransferAsset instance = new TransferAsset();

    private TransferAsset() {
        super(new APITag[] {APITag.AE, APITag.CREATE_TRANSACTION}, "recipient", "asset", "quantityQNT", "comment");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {

        Long recipient = ParameterParser.getRecipientId(req);

        String comment = Convert.nullToEmpty(req.getParameter("comment")).trim();
        if (comment.length() > Constants.MAX_ASSET_TRANSFER_COMMENT_LENGTH) {
            return INCORRECT_ASSET_TRANSFER_COMMENT;
        }

        Asset asset = ParameterParser.getAsset(req);
        long quantityQNT = ParameterParser.getQuantityQNT(req);
        Account account = ParameterParser.getSenderAccount(req);

        Long assetBalance = account.getUnconfirmedAssetBalanceQNT(asset.getId());
        if (assetBalance == null || quantityQNT > assetBalance) {
            return NOT_ENOUGH_ASSETS;
        }

        Attachment attachment = new Attachment.ColoredCoinsAssetTransfer(asset.getId(), quantityQNT, comment);
        return createTransaction(req, account, recipient, 0, attachment);

    }

}
