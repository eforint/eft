package eft.http;

import eft.EftException;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

public final class GetAsset extends APIServlet.APIRequestHandler {

    static final GetAsset instance = new GetAsset();

    private GetAsset() {
        super(new APITag[] {APITag.AE}, "asset");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {
        return JSONData.asset(ParameterParser.getAsset(req));
    }

}
