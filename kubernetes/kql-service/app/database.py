import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "/tmp/kql-simulator.db"

COMPUTERS = [
    "DC01.corp.local", "DC02.corp.local",
    "WEB01.corp.local", "WEB02.corp.local", "WEB03.corp.local",
    "APP01.corp.local", "APP02.corp.local",
    "DB01.corp.local", "DB02.corp.local",
    "FS01.corp.local", "FS02.corp.local",
    "WKS-ALICE", "WKS-BOB", "WKS-CAROL", "WKS-DAVE",
    "WKS-EVE", "WKS-FRANK", "WKS-GRACE", "WKS-HENRY",
    "WKS-IRENE", "WKS-JACK", "WKS-KATE", "WKS-LEO",
    "LAPTOP-SALES01", "LAPTOP-SALES02", "LAPTOP-HR01",
    "LAPTOP-IT01", "LAPTOP-IT02", "LAPTOP-MGMT01",
    "SRV-BACKUP01", "SRV-PRINT01",
]

ACCOUNTS = [
    "alice.smith", "bob.jones", "carol.white", "dave.brown",
    "eve.davis", "frank.miller", "grace.wilson", "henry.moore",
    "irene.taylor", "jack.anderson", "kate.thomas", "leo.jackson",
    "mary.harris", "nick.martin", "olivia.garcia", "peter.martinez",
    "quinn.robinson", "rachel.clark", "sam.rodriguez", "tina.lewis",
    "admin", "Administrator", "svc_backup", "svc_deploy",
    "svc_monitor", "svc_db", "helpdesk01", "helpdesk02",
    "it_admin01", "it_admin02", "domain_admin",
    # Suspicious / brute-force accounts
    "guest", "test", "user", "admin123", "root",
]

INTERNAL_IPS = [
    "10.0.0.{}".format(i) for i in range(1, 51)
] + [
    "192.168.1.{}".format(i) for i in range(1, 31)
] + [
    "172.16.0.{}".format(i) for i in range(1, 21)
]

EXTERNAL_IPS = [
    "45.33.32.156", "185.220.101.34", "91.108.4.12",
    "104.21.14.78", "198.51.100.42", "203.0.113.99",
    "45.142.212.100", "185.176.27.13", "94.102.49.190",
    "179.43.128.10", "91.219.236.18", "77.247.181.163",
    "5.188.86.172", "195.54.160.149", "109.201.133.195",
    "82.221.105.7", "31.13.64.35", "157.240.14.35",
    "216.58.212.142", "151.101.65.69",
]

EVENT_TYPES_SUCCESS = [4624, 4634, 4648, 4768, 4769, 4776]
EVENT_TYPES_FAILURE = [4625, 4771, 4776]

LOGON_TYPES = {
    2: "Interactive",
    3: "Network",
    4: "Batch",
    5: "Service",
    7: "Unlock",
    10: "RemoteInteractive",
    11: "CachedInteractive",
}

ACTIVITY_MAP = {
    4624: "An account was successfully logged on",
    4625: "An account failed to log on",
    4634: "An account was logged off",
    4648: "A logon was attempted using explicit credentials",
    4768: "A Kerberos authentication ticket was requested",
    4769: "A Kerberos service ticket was requested",
    4771: "Kerberos pre-authentication failed",
    4776: "The computer attempted to validate the credentials for an account",
}

SUBSTATUS_CODES = {
    "0xC000006A": "Wrong password",
    "0xC0000064": "User does not exist",
    "0xC000006D": "Bad username or authentication info",
    "0xC000006F": "Outside authorized hours",
    "0xC0000070": "Unauthorized workstation",
    "0xC0000071": "Expired password",
    "0xC0000072": "Account disabled",
    "0xC000015B": "Logon type not granted",
    "0xC0000193": "Account expired",
    "0xC0000234": "Account locked out",
}


def _random_timestamp(days_back: int = 30) -> str:
    base = datetime.now() - timedelta(days=days_back)
    offset = timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )
    return (base + offset).strftime("%Y-%m-%d %H:%M:%S")


def _generate_records(n: int = 500) -> list[tuple]:
    random.seed(42)
    records = []

    # Weight toward more interesting events
    success_weight = 0.68
    # Simulate a brute-force spike from a few external IPs against a few accounts
    brute_force_accounts = ["admin", "Administrator", "root", "guest"]
    brute_force_ips = random.sample(EXTERNAL_IPS, 4)

    for i in range(1, n + 1):
        is_brute = random.random() < 0.12  # 12% brute-force attempts

        if is_brute:
            account = random.choice(brute_force_accounts)
            ip = random.choice(brute_force_ips)
            event_id = random.choice(EVENT_TYPES_FAILURE)
            status = "Failure"
            logon_type = random.choice([3, 10])
            substatus = random.choice(list(SUBSTATUS_CODES.keys()))
            activity = ACTIVITY_MAP[event_id]
            computer = random.choice(["DC01.corp.local", "DC02.corp.local", "WEB01.corp.local"])
        else:
            is_success = random.random() < success_weight
            account = random.choice(ACCOUNTS[:26])  # legitimate accounts only

            if is_success:
                event_id = random.choice(EVENT_TYPES_SUCCESS)
                status = "Success"
                substatus = "0x0"
                ip = random.choice(INTERNAL_IPS)
            else:
                event_id = random.choice(EVENT_TYPES_FAILURE)
                status = "Failure"
                substatus = random.choice(list(SUBSTATUS_CODES.keys()))
                # Failed from internal or external
                ip = random.choice(INTERNAL_IPS + EXTERNAL_IPS[:8])

            logon_type = random.choices(
                list(LOGON_TYPES.keys()),
                weights=[10, 35, 5, 15, 8, 12, 15],
            )[0]
            activity = ACTIVITY_MAP[event_id]
            computer = random.choice(COMPUTERS)

        records.append((
            event_id,
            _random_timestamp(),
            computer,
            account,
            "SuccessAudit" if status == "Success" else "FailureAudit",
            activity,
            ip,
            logon_type,
            status,
        ))

    return records


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def seed_database() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS security_events (
            EventID       INTEGER NOT NULL,
            TimeGenerated TEXT    NOT NULL,
            Computer      TEXT    NOT NULL,
            Account       TEXT    NOT NULL,
            EventType     TEXT    NOT NULL,
            Activity      TEXT    NOT NULL,
            IpAddress     TEXT    NOT NULL,
            LogonType     INTEGER NOT NULL,
            Status        TEXT    NOT NULL
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM security_events")
    if cursor.fetchone()[0] == 0:
        records = _generate_records(500)
        cursor.executemany(
            "INSERT INTO security_events VALUES (?,?,?,?,?,?,?,?,?)",
            records,
        )
        conn.commit()

    conn.close()


if __name__ == "__main__":
    seed_database()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM security_events")
    print(f"Seeded {cursor.fetchone()[0]} security_events records into '{DB_PATH}'")
    cursor.execute(
        "SELECT Status, COUNT(*) FROM security_events GROUP BY Status"
    )
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    conn.close()
