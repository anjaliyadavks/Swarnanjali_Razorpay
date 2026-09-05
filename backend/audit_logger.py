import json
from datetime import datetime
from models import AuditLogEntry
from typing import List

class AuditLogger:
    def __init__(self):
        self.logs: List[AuditLogEntry] = []
        
    def log(self, entry: AuditLogEntry):
        self.logs.append(entry)
        
    def get_logs(self):
        return [log.model_dump() for log in self.logs]
        
    def clear(self):
        self.logs = []

audit_logger = AuditLogger()
