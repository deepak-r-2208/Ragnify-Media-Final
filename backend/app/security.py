"""No login/signup: every request is treated as one fixed local user.

There used to be a full email+password auth flow here (bcrypt hashing,
JWTs). That's been removed — this app now runs as a single-user local
tool, so get_current_user() below just returns a constant user instead of
checking a bearer token. The corresponding row is seeded in
backend/sql/schema.sql (id 00000000-0000-0000-0000-000000000001).
"""

from dataclasses import dataclass

LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001"
LOCAL_USER_EMAIL = "local@ragnify.local"


@dataclass
class CurrentUser:
    id: str
    email: str | None


async def get_current_user() -> CurrentUser:
    return CurrentUser(id=LOCAL_USER_ID, email=LOCAL_USER_EMAIL)
