"""Virtual applications module providing OS application mocks and artifacts."""

from .browser import SITES, get_browser_page
from .files import (
    COLD_VOLUMES,
    VIRTUAL_FILES,
    get_file_artifacts,
    list_device_volumes,
    unseal_volume,
)
from .mail import (
    EMAILS,
    get_inbox_emails,
    get_mail_artifacts,
    mark_email_read,
    send_email,
)
from .messenger import (
    THREADS,
    get_messenger_threads,
    get_signal_message_artifacts,
    get_signal_thread_artifacts,
    send_message_to_thread,
)
from .terminal import VIRTUAL_FS, execute_terminal_command

__all__ = [
    "SITES",
    "get_browser_page",
    "COLD_VOLUMES",
    "VIRTUAL_FILES",
    "list_device_volumes",
    "unseal_volume",
    "get_file_artifacts",
    "EMAILS",
    "get_inbox_emails",
    "mark_email_read",
    "send_email",
    "get_mail_artifacts",
    "THREADS",
    "get_messenger_threads",
    "send_message_to_thread",
    "get_signal_thread_artifacts",
    "get_signal_message_artifacts",
    "VIRTUAL_FS",
    "execute_terminal_command",
]
