package eft.peer;

import eft.Eft;
import eft.Transaction;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

final class GetUnconfirmedTransactions extends PeerServlet.PeerRequestHandler {

    static final GetUnconfirmedTransactions instance = new GetUnconfirmedTransactions();

    private GetUnconfirmedTransactions() {}


    @Override
    JSONStreamAware processRequest(JSONObject request, Peer peer) {

        JSONObject response = new JSONObject();

        JSONArray transactionsData = new JSONArray();
        for (Transaction transaction : Eft.getTransactionProcessor().getAllUnconfirmedTransactions()) {

            transactionsData.add(transaction.getJSONObject());

        }
        response.put("unconfirmedTransactions", transactionsData);


        return response;
    }

}
