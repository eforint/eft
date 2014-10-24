package eft.http;

import eft.Account;
import eft.Attachment;
import eft.EftException;
import eft.Poll;
import eft.util.Convert;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_POLL;
import static eft.http.JSONResponses.INCORRECT_VOTE;
import static eft.http.JSONResponses.MISSING_POLL;

public final class CastVote extends CreateTransaction {

    static final CastVote instance = new CastVote();

    private CastVote() {
        super(new APITag[] {APITag.VS, APITag.CREATE_TRANSACTION}, "poll", "vote1", "vote2", "vote3"); // hardcoded to 3 votes for testing
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {

        String pollValue = req.getParameter("poll");

        if (pollValue == null) {
            return MISSING_POLL;
        }

        Poll pollData;
        int numberOfOptions = 0;
        try {
            pollData = Poll.getPoll(Convert.parseUnsignedLong(pollValue));
            if (pollData != null) {
                numberOfOptions = pollData.getOptions().length;
            } else {
                return INCORRECT_POLL;
            }
        } catch (RuntimeException e) {
            return INCORRECT_POLL;
        }

        byte[] vote = new byte[numberOfOptions];
        try {
            for (int i = 0; i < numberOfOptions; i++) {
                String voteValue = req.getParameter("vote" + i);
                if (voteValue != null) {
                    vote[i] = Byte.parseByte(voteValue);
                }
            }
        } catch (NumberFormatException e) {
            return INCORRECT_VOTE;
        }

        Account account = ParameterParser.getSenderAccount(req);

        Attachment attachment = new Attachment.MessagingVoteCasting(pollData.getId(), vote);
        return createTransaction(req, account, attachment);

    }

}
