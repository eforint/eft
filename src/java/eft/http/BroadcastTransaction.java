package eft.http;

import eft.Eft;
import eft.EftException;
import eft.Transaction;
import eft.util.Convert;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;
import org.json.simple.JSONValue;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_TRANSACTION_BYTES;
import static eft.http.JSONResponses.MISSING_TRANSACTION_BYTES_OR_JSON;

public final class BroadcastTransaction extends APIServlet.APIRequestHandler {

    static final BroadcastTransaction instance = new BroadcastTransaction();

    private BroadcastTransaction() {
        super(new APITag[] {APITag.TRANSACTIONS}, "transactionBytes", "transactionJSON");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException.ValidationException {

        String transactionBytes = Convert.emptyToNull(req.getParameter("transactionBytes"));
        String transactionJSON = Convert.emptyToNull(req.getParameter("transactionJSON"));
        if (transactionBytes == null && transactionJSON == null) {
            return MISSING_TRANSACTION_BYTES_OR_JSON;
        }

        try {

            Transaction transaction;
            if (transactionBytes != null) {
                byte[] bytes = Convert.parseHexString(transactionBytes);
                transaction = Eft.getTransactionProcessor().parseTransaction(bytes);
            } else {
                JSONObject json = (JSONObject) JSONValue.parse(transactionJSON);
                transaction = Eft.getTransactionProcessor().parseTransaction(json);
            }
            transaction.validateAttachment();

            JSONObject response = new JSONObject();

            try {
                Eft.getTransactionProcessor().broadcast(transaction);
                response.put("transaction", transaction.getStringId());
                response.put("fullHash", transaction.getFullHash());
            } catch (EftException.ValidationException e) {
                response.put("error", e.getMessage());
            }

            return response;

        } catch (RuntimeException e) {
            return INCORRECT_TRANSACTION_BYTES;
        }
    }

    @Override
    boolean requirePost() {
        return true;
    }

}
