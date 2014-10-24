package eft.http;

import eft.Account;
import eft.Alias;
import eft.Attachment;
import eft.EftException;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_ALIAS_NOTFORSALE;


public final class BuyAlias extends CreateTransaction {

    static final BuyAlias instance = new BuyAlias();

    private BuyAlias() {
        super(new APITag[] {APITag.ALIASES, APITag.CREATE_TRANSACTION}, "alias", "aliasName");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {
        Account buyer = ParameterParser.getSenderAccount(req);
        Alias alias = ParameterParser.getAlias(req);
        long amountNQT = ParameterParser.getAmountNQT(req);
        if (Alias.getOffer(alias.getAliasName()) == null) {
            return INCORRECT_ALIAS_NOTFORSALE;
        }
        Long sellerId = alias.getAccountId();
        Attachment attachment = new Attachment.MessagingAliasBuy(alias.getAliasName());
        return createTransaction(req, buyer, sellerId, amountNQT, attachment);
    }
}
