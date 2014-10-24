package eft;

import java.util.Calendar;
import java.util.TimeZone;

public final class Constants {

    public static final int BLOCK_HEADER_LENGTH = 232;
    public static final int MAX_NUMBER_OF_TRANSACTIONS = 255;
    public static final int MAX_PAYLOAD_LENGTH = MAX_NUMBER_OF_TRANSACTIONS * 176;
    public static final long MAX_BALANCE_EFT = 1000000000;
    public static final long ONE_EFT = 100000000;
    public static final long MAX_BALANCE_NQT = MAX_BALANCE_EFT * ONE_EFT;
 
    public static final long INITIAL_BASE_TARGET = 9018400000000L;
                                                                                                                                                                      
    public static final long MAX_BASE_TARGET = 9223372036854775807L; 

    public static final int MAX_ALIAS_URI_LENGTH = 1000;
    public static final int MAX_ALIAS_LENGTH = 100;

    public static final int MAX_ARBITRARY_MESSAGE_LENGTH = 1000;
    public static final int MAX_ENCRYPTED_MESSAGE_LENGTH = 1000;

    public static final int MAX_ACCOUNT_NAME_LENGTH = 100;
    public static final int MAX_ACCOUNT_DESCRIPTION_LENGTH = 1000;

    public static final long MAX_ASSET_QUANTITY_QNT = 1000000000L * 100000000L;
    public static final long ASSET_ISSUANCE_FEE_NQT = 1000 * ONE_EFT;
    public static final int MIN_ASSET_NAME_LENGTH = 3;
    public static final int MAX_ASSET_NAME_LENGTH = 10;
    public static final int MAX_ASSET_DESCRIPTION_LENGTH = 1000;
    public static final int MAX_ASSET_TRANSFER_COMMENT_LENGTH = 1000;

    public static final int MAX_POLL_NAME_LENGTH = 100;
    public static final int MAX_POLL_DESCRIPTION_LENGTH = 1000;
    public static final int MAX_POLL_OPTION_LENGTH = 100;
    public static final int MAX_POLL_OPTION_COUNT = 100;

    public static final int MAX_DGS_LISTING_QUANTITY = 1000000000;
    public static final int MAX_DGS_LISTING_NAME_LENGTH = 100;
    public static final int MAX_DGS_LISTING_DESCRIPTION_LENGTH = 1000;
    public static final int MAX_DGS_LISTING_TAGS_LENGTH = 100;
    public static final int MAX_DGS_GOODS_LENGTH = 10240;

    public static final int MAX_HUB_ANNOUNCEMENT_URIS = 100;
    public static final int MAX_HUB_ANNOUNCEMENT_URI_LENGTH = 1000;
    public static final long MIN_HUB_EFFECTIVE_BALANCE = 100000;

    public static final boolean isTestnet = Eft.getBooleanProperty("eft.isTestnet");
    public static final boolean isOffline = Eft.getBooleanProperty("eft.isOffline");

    public static final int ALIAS_SYSTEM_BLOCK = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK = 1445;
    public static final int ARBITRARY_MESSAGES_BLOCK = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_2 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_3 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_4 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_5 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_6 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_7 = 1445;
    public static final int TRANSPARENT_FORGING_BLOCK_8 = 1445;
    public static final int NQT_BLOCK = 1445;
    public static final int FRACTIONAL_BLOCK = 1445;
    public static final int ASSET_EXCHANGE_BLOCK = 1445;
    public static final int REFERENCED_TRANSACTION_FULL_HASH_BLOCK = 1445;
    public static final int REFERENCED_TRANSACTION_FULL_HASH_BLOCK_TIMESTAMP = 1445;
    public static final int VOTING_SYSTEM_BLOCK = Integer.MAX_VALUE;
    public static final int DIGITAL_GOODS_STORE_BLOCK = 1445;
    public static final int PUBLIC_KEY_ANNOUNCEMENT_BLOCK = Integer.MAX_VALUE;

    static final long UNCONFIRMED_POOL_DEPOSIT_NQT = (isTestnet ? 50 : 100) * ONE_EFT;

    public static final long EPOCH_BEGINNING;
    static {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        calendar.set(Calendar.YEAR, 2014);
        calendar.set(Calendar.MONTH, Calendar.OCTOBER);
        calendar.set(Calendar.DAY_OF_MONTH, 23);
        calendar.set(Calendar.HOUR_OF_DAY, 12);
        calendar.set(Calendar.MINUTE, 00);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        EPOCH_BEGINNING = calendar.getTimeInMillis();
    }

    public static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

    public static final int EC_RULE_TERMINATOR = 600; /* cfb: This constant defines a straight edge when "longest chain"
                                                        rule is outweighed by "economic majority" rule; the terminator
                                                        is set as number of seconds before the current time. */

    public static final int EC_BLOCK_DISTANCE_LIMIT = 60;

    private Constants() {} // never

}
