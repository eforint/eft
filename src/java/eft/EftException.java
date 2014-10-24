package eft;

public abstract class EftException extends Exception {

    protected EftException() {
        super();
    }

    protected EftException(String message) {
        super(message);
    }

    protected EftException(String message, Throwable cause) {
        super(message, cause);
    }

    protected EftException(Throwable cause) {
        super(cause);
    }

    public static abstract class ValidationException extends EftException {

        private ValidationException(String message) {
            super(message);
        }

        private ValidationException(String message, Throwable cause) {
            super(message, cause);
        }

    }

    public static class NotCurrentlyValidException extends ValidationException {

        public NotCurrentlyValidException(String message) {
            super(message);
        }

        public NotCurrentlyValidException(String message, Throwable cause) {
            super(message, cause);
        }

    }

    public static final class NotYetEnabledException extends NotCurrentlyValidException {

        public NotYetEnabledException(String message) {
            super(message);
        }

        public NotYetEnabledException(String message, Throwable throwable) {
            super(message, throwable);
        }

    }

    public static final class NotValidException extends ValidationException {

        public NotValidException(String message) {
            super(message);
        }

        public NotValidException(String message, Throwable cause) {
            super(message, cause);
        }

    }

}
