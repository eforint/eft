package eft.http;

import eft.Account;
import eft.crypto.Crypto;
import eft.util.Convert;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.MISSING_SECRET_PHRASE_OR_PUBLIC_KEY;

public final class GetAccountId extends APIServlet.APIRequestHandler {

    static final GetAccountId instance = new GetAccountId();

    private GetAccountId() {
        super(new APITag[] {APITag.ACCOUNTS}, "secretPhrase", "publicKey");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) {

        Long accountId;
        String secretPhrase = Convert.emptyToNull(req.getParameter("secretPhrase"));
        String publicKeyString = Convert.emptyToNull(req.getParameter("publicKey"));
        if (secretPhrase != null) {
            byte[] publicKey = Crypto.getPublicKey(secretPhrase);
            accountId = Account.getId(publicKey);
            publicKeyString = Convert.toHexString(publicKey);
        } else if (publicKeyString != null) {
            accountId = Account.getId(Convert.parseHexString(publicKeyString));
        } else {
            return MISSING_SECRET_PHRASE_OR_PUBLIC_KEY;
        }

        JSONObject response = new JSONObject();
        JSONData.putAccount(response, "account", accountId);
        response.put("publicKey", publicKeyString);

        return response;
    }

    @Override
    boolean requirePost() {
        return true;
    }

}
