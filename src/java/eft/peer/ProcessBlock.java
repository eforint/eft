package eft.peer;

import eft.Eft;
import eft.EftException;
import eft.util.Convert;
import eft.util.JSON;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

final class ProcessBlock extends PeerServlet.PeerRequestHandler {

    static final ProcessBlock instance = new ProcessBlock();

    private ProcessBlock() {}

    private static final JSONStreamAware ACCEPTED;
    static {
        JSONObject response = new JSONObject();
        response.put("accepted", true);
        ACCEPTED = JSON.prepare(response);
    }

    private static final JSONStreamAware NOT_ACCEPTED;
    static {
        JSONObject response = new JSONObject();
        response.put("accepted", false);
        NOT_ACCEPTED = JSON.prepare(response);
    }

    @Override
    JSONStreamAware processRequest(JSONObject request, Peer peer) {

        try {

            if (! Eft.getBlockchain().getLastBlock().getId().equals(Convert.parseUnsignedLong((String) request.get("previousBlock")))) {
                // do this check first to avoid validation failures of future blocks and transactions
                // when loading blockchain from scratch
                return NOT_ACCEPTED;
            }
            Eft.getBlockchainProcessor().processPeerBlock(request);
            return ACCEPTED;

        } catch (EftException|RuntimeException e) {
            if (peer != null) {
                peer.blacklist(e);
            }
            return NOT_ACCEPTED;
        }

    }

}
