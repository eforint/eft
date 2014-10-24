package eft.http;

import eft.Account;
import eft.Attachment;
import eft.EftException;
import eft.Order;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.UNKNOWN_ORDER;

public final class CancelAskOrder extends CreateTransaction {

    static final CancelAskOrder instance = new CancelAskOrder();

    private CancelAskOrder() {
        super(new APITag[] {APITag.AE, APITag.CREATE_TRANSACTION}, "order");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {
        Long orderId = ParameterParser.getOrderId(req);
        Account account = ParameterParser.getSenderAccount(req);
        Order.Ask orderData = Order.Ask.getAskOrder(orderId);
        if (orderData == null || !orderData.getAccount().getId().equals(account.getId())) {
            return UNKNOWN_ORDER;
        }
        Attachment attachment = new Attachment.ColoredCoinsAskOrderCancellation(orderId);
        return createTransaction(req, account, attachment);
    }

}
