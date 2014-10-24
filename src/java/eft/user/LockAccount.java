package eft.user;

import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

import static eft.user.JSONResponses.LOCK_ACCOUNT;

public final class LockAccount extends UserServlet.UserRequestHandler {

    static final LockAccount instance = new LockAccount();

    private LockAccount() {}

    @Override
    JSONStreamAware processRequest(HttpServletRequest req, User user) throws IOException {

        user.lockAccount();

        return LOCK_ACCOUNT;
    }
}
