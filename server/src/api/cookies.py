from fastapi import Response

# Cookie settings for refresh token
COOKIE_NAME = "sb-refresh-token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def set_refresh_cookie(resp: Response, refresh_token: str) -> None:
    """Set HttpOnly refresh token cookie for cross-site usage (mobile/web)."""
    resp.set_cookie(
        key=COOKIE_NAME,
        value=refresh_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )


def clear_refresh_cookie(resp: Response) -> None:
    """Clear the refresh token cookie."""
    resp.delete_cookie(COOKIE_NAME, path="/", samesite="none")


