package eft.http;

import eft.EftException;
import eft.Order;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.UNKNOWN_ORDER;

public final class GetBidOrder extends APIServlet.APIRequestHandler {

    static final GetBidOrder instance = new GetBidOrder();

    private GetBidOrder() {
        super(new APITag[] {APITag.AE}, "order");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {
        Long orderId = ParameterParser.getOrderId(req);
        Order.Bid bidOrder = Order.Bid.getBidOrder(orderId);
        if (bidOrder == null) {
            return UNKNOWN_ORDER;
        }
        return JSONData.bidOrder(bidOrder);
    }

}
