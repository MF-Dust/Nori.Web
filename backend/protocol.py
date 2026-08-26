"""Backward-compatibility re-export for `backend.core.protocol`."""

from .core.protocol import (
    CLIENT_TYPES,
    Json,
    ProtocolError,
    dispatch_failure_message,
    dispatch_success_message,
    error_message,
    runtime_transition_message,
    validate_client_message,
    visibility_advanced_message,
)

__all__ = [
    "CLIENT_TYPES",
    "Json",
    "ProtocolError",
    "validate_client_message",
    "error_message",
    "runtime_transition_message",
    "visibility_advanced_message",
    "dispatch_success_message",
    "dispatch_failure_message",
]
