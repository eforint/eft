package eft.http;

import eft.Order;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;
import java.util.Collection;

public final class GetAllOpenOrders extends APIServlet.APIRequestHandler {

    static final GetAllOpenOrders instance = new GetAllOpenOrders();

    private GetAllOpenOrders() {
        super(new APITag[] {APITag.AE});
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) {

        JSONObject response = new JSONObject();
        JSONArray ordersData = new JSONArray();

        try {
            Collection<Order.Ask> askOrders = Order.Ask.getAllAskOrders();
            Collection<Order.Bid> bidOrders = Order.Bid.getAllBidOrders();

            for (Order.Ask order : askOrders) {
                ordersData.add(JSONData.askOrder(order));
            }
            for (Order.Bid order : bidOrders) {
                ordersData.add(JSONData.bidOrder(order));
            }

        } catch (RuntimeException e) {
            response.put("error", e.toString());
        }

        response.put("openOrders", ordersData);
        return response;
    }

}
