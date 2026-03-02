from __future__ import annotations

from abc import ABC


class AbstractService(ABC):
    """
    Base type for all application services.

    Concrete services will encapsulate business logic and orchestrate
    repositories and other infrastructure concerns.
    """

    pass

