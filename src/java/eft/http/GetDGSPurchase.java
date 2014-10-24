package eft.http;

import eft.EftException;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

public final class GetDGSPurchase extends APIServlet.APIRequestHandler {

    static final GetDGSPurchase instance = new GetDGSPurchase();

    private GetDGSPurchase() {
        super(new APITag[] {APITag.DGS}, "purchase");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {
        return JSONData.purchase(ParameterParser.getPurchase(req));
    }

}
