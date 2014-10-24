package eft.http;

import eft.Account;
import eft.EftException;
import eft.crypto.EncryptedData;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

import static eft.http.JSONResponses.INCORRECT_RECIPIENT;

public final class EncryptTo extends APIServlet.APIRequestHandler {

    static final EncryptTo instance = new EncryptTo();

    private EncryptTo() {
        super(new APITag[] {APITag.MESSAGES}, "recipient", "messageToEncrypt", "messageToEncryptIsText", "secretPhrase");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) throws EftException {

        Long recipientId = ParameterParser.getRecipientId(req);
        Account recipientAccount = Account.getAccount(recipientId);
        if (recipientAccount == null || recipientAccount.getPublicKey() == null) {
            return INCORRECT_RECIPIENT;
        }

        EncryptedData encryptedData = ParameterParser.getEncryptedMessage(req, recipientAccount);
        return JSONData.encryptedData(encryptedData);

    }

}
