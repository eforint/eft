package eft.http;

import eft.Account;
import eft.Alias;
import eft.Asset;
import eft.Generator;
import eft.Eft;
import eft.Order;
import eft.Poll;
import eft.Trade;
import eft.Vote;
import eft.peer.Peer;
import eft.peer.Peers;
import eft.util.Convert;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

public final class GetState extends APIServlet.APIRequestHandler {

    static final GetState instance = new GetState();

    private GetState() {
        super(new APITag[] {APITag.INFO});
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) {

        JSONObject response = new JSONObject();

        response.put("application", Eft.APPLICATION);
        response.put("version", Eft.VERSION);
        response.put("time", Convert.getEpochTime());
        response.put("lastBlock", Eft.getBlockchain().getLastBlock().getStringId());
        response.put("cumulativeDifficulty", Eft.getBlockchain().getLastBlock().getCumulativeDifficulty().toString());

        long totalEffectiveBalance = 0;
        for (Account account : Account.getAllAccounts()) {
            long effectiveBalanceEFT = account.getEffectiveBalanceEFT();
            if (effectiveBalanceEFT > 0) {
                totalEffectiveBalance += effectiveBalanceEFT;
            }
        }
        response.put("totalEffectiveBalanceEFT", totalEffectiveBalance);

        response.put("numberOfBlocks", Eft.getBlockchain().getHeight() + 1);
        response.put("numberOfTransactions", Eft.getBlockchain().getTransactionCount());
        response.put("numberOfAccounts", Account.getAllAccounts().size());
        response.put("numberOfAssets", Asset.getAllAssets().size());
        response.put("numberOfOrders", Order.Ask.getAllAskOrders().size() + Order.Bid.getAllBidOrders().size());
        int numberOfTrades = 0;
        for (List<Trade> assetTrades : Trade.getAllTrades()) {
            numberOfTrades += assetTrades.size();
        }
        response.put("numberOfTrades", numberOfTrades);
        response.put("numberOfAliases", Alias.getAllAliases().size());
        response.put("numberOfPolls", Poll.getAllPolls().size());
        response.put("numberOfVotes", Vote.getVotes().size());
        response.put("numberOfPeers", Peers.getAllPeers().size());
        response.put("numberOfUnlockedAccounts", Generator.getAllGenerators().size());
        Peer lastBlockchainFeeder = Eft.getBlockchainProcessor().getLastBlockchainFeeder();
        response.put("lastBlockchainFeeder", lastBlockchainFeeder == null ? null : lastBlockchainFeeder.getAnnouncedAddress());
        response.put("lastBlockchainFeederHeight", Eft.getBlockchainProcessor().getLastBlockchainFeederHeight());
        response.put("isScanning", Eft.getBlockchainProcessor().isScanning());
        response.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        response.put("maxMemory", Runtime.getRuntime().maxMemory());
        response.put("totalMemory", Runtime.getRuntime().totalMemory());
        response.put("freeMemory", Runtime.getRuntime().freeMemory());

        return response;
    }

}
