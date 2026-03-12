from typing import Tuple


class CollectionNames:
    ADMINS = "admins"
    OWNERS = "owners"
    TENANTS = "tenants"
    REGISTRATION_LINKS = "registration_links"
    NOTICES = "notices"
    NOTICE_FORM_SETTINGS = "notice_form_settings"
    AGREEMENTS = "agreements"
    POLICE_VERIFICATIONS = "police_verifications"
    PAYMENTS = "payments"
    EXPENSES = "expenses"
    COMPANY_ACCOUNTS = "company_accounts"
    COMPANY_INVESTMENTS = "company_investments"

    @classmethod
    def all(cls) -> Tuple[str, ...]:
        return (
            cls.ADMINS,
            cls.OWNERS,
            cls.TENANTS,
            cls.REGISTRATION_LINKS,
            cls.NOTICES,
            cls.NOTICE_FORM_SETTINGS,
            cls.AGREEMENTS,
            cls.POLICE_VERIFICATIONS,
            cls.PAYMENTS,
            cls.EXPENSES,
            cls.COMPANY_ACCOUNTS,
            cls.COMPANY_INVESTMENTS,
        )


class AgreementStatus:
    ACTIVE = "active"
    EXPIRED = "expired"


class DashboardLimits:
    RECENT_ITEMS_LIMIT = 5

