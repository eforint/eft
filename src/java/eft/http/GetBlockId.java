package eft.http;

import eft.Eft;
import eft.util.Convert;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_HEIGHT;
import static eft.http.JSONResponses.MISSING_HEIGHT;

public final class GetBlockId extends APIServlet.APIRequestHandler {

    static final GetBlockId instance = new GetBlockId();

    private GetBlockId() {
        super(new APITag[] {APITag.BLOCKS}, "height");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) {

        int height;
        try {
            String heightValue = Convert.emptyToNull(req.getParameter("height"));
            if (heightValue == null) {
                return MISSING_HEIGHT;
            }
            height = Integer.parseInt(heightValue);
        } catch (RuntimeException e) {
            return INCORRECT_HEIGHT;
        }

        try {
            JSONObject response = new JSONObject();
            response.put("block", Convert.toUnsignedLong(Eft.getBlockchain().getBlockIdAtHeight(height)));
            return response;
        } catch (RuntimeException e) {
            return INCORRECT_HEIGHT;
        }

    }

}