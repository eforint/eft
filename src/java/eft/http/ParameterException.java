package eft.http;

import eft.EftException;
import org.json.simple.JSONStreamAware;

final class ParameterException extends EftException {

    private final JSONStreamAware errorResponse;

    ParameterException(JSONStreamAware errorResponse) {
        this.errorResponse = errorResponse;
    }

    JSONStreamAware getErrorResponse() {
        return errorResponse;
    }

}
