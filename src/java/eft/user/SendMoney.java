package eft.user;

import eft.Account;
import eft.Attachment;
import eft.Constants;
import eft.Eft;
import eft.EftException;
import eft.Transaction;
import eft.util.Convert;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

import static eft.user.JSONResponses.NOTIFY_OF_ACCEPTED_TRANSACTION;

public final class SendMoney extends UserServlet.UserRequestHandler {

    static final SendMoney instance = new SendMoney();

    private SendMoney() {}

    @Override
    JSONStreamAware processRequest(HttpServletRequest req, User user) throws EftException.ValidationException, IOException {
        if (user.getSecretPhrase() == null) {
            return null;
        }

        String recipientValue = req.getParameter("recipient");
        String amountValue = req.getParameter("amountEFT");
        String feeValue = req.getParameter("feeEFT");
        String deadlineValue = req.getParameter("deadline");
        String secretPhrase = req.getParameter("secretPhrase");

        Long recipient;
        long amountNQT = 0;
        long feeNQT = 0;
        short deadline = 0;

        try {

            recipient = Convert.parseUnsignedLong(recipientValue);
            if (recipient == null) throw new IllegalArgumentException("invalid recipient");
            amountNQT = Convert.parseEFT(amountValue.trim());
            feeNQT = Convert.parseEFT(feeValue.trim());
            deadline = (short)(Double.parseDouble(deadlineValue) * 60);

        } catch (RuntimeException e) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "One of the fields is filled incorrectly!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;
        }

        if (! user.getSecretPhrase().equals(secretPhrase)) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "Wrong secret phrase!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;

        } else if (amountNQT <= 0 || amountNQT > Constants.MAX_BALANCE_NQT) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "\"Amount\" must be greater than 0!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;

        } else if (feeNQT < Constants.ONE_EFT || feeNQT > Constants.MAX_BALANCE_NQT) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "\"Fee\" must be at least 1 EFT!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;

        } else if (deadline < 1 || deadline > 1440) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "\"Deadline\" must be greater or equal to 1 minute and less than 24 hours!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;

        }

        Account account = Account.getAccount(user.getPublicKey());
        if (account == null || Convert.safeAdd(amountNQT, feeNQT) > account.getUnconfirmedBalanceNQT()) {

            JSONObject response = new JSONObject();
            response.put("response", "notifyOfIncorrectTransaction");
            response.put("message", "Not enough funds!");
            response.put("recipient", recipientValue);
            response.put("amountEFT", amountValue);
            response.put("feeEFT", feeValue);
            response.put("deadline", deadlineValue);

            return response;

        } else {

            final Transaction transaction = Eft.getTransactionProcessor().newTransactionBuilder(user.getPublicKey(),
                    amountNQT, feeNQT, deadline, Attachment.ORDINARY_PAYMENT).recipientId(recipient).build();
            transaction.validateAttachment();
            transaction.sign(user.getSecretPhrase());

            Eft.getTransactionProcessor().broadcast(transaction);

            return NOTIFY_OF_ACCEPTED_TRANSACTION;

        }
    }

    @Override
    boolean requirePost() {
        return true;
    }

}
