import hashlib
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import execute_batch

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "fleetguard",
    "user": "fleetguard_app",
    "password": "fleetguard_secret_pass"
}

def generate_valid_vin(idx):
    weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
    trans = {
        'A':1,'B':2,'C':3,'D':4,'E':5,'F':6,'G':7,'H':8,
        'J':1,'K':2,'L':3,'M':4,'N':5,'P':7,'R':9,
        'S':2,'T':3,'U':4,'V':5,'W':6,'X':7,'Y':8,'Z':9
    }
    for c in '0123456789':
        trans[c] = int(c)
    
    # Prefix (WMI + VDS part)
    prefix = "1HGCM826"
    # Suffix: year '3', plant 'A', seq 6 digits
    suffix = f"3A{idx:06d}"
    
    # Calculate check digit at pos 9 (0-indexed 8)
    # Temporary char '0' at pos 8
    temp = prefix + "0" + suffix
    total = sum(trans[char] * weights[i] for i, char in enumerate(temp))
    rem = total % 11
    chk = 'X' if rem == 10 else str(rem)
    return prefix + chk + suffix

def init_schema(cur):
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tenant (
        tenant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS plan (
        plan_id smallint PRIMARY KEY,
        name text NOT NULL UNIQUE,
        monthly_price_cents int NOT NULL CHECK (monthly_price_cents >= 0),
        vehicle_limit int NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscription (
        subscription_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenant,
        plan_id smallint NOT NULL REFERENCES plan,
        status text NOT NULL CHECK (status IN ('active','past_due','cancelled')),
        period_start date NOT NULL,
        period_end date NOT NULL CHECK (period_end > period_start)
    );
    CREATE TABLE IF NOT EXISTS invoice (
        invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id uuid NOT NULL REFERENCES subscription,
        amount_cents int NOT NULL,
        issued_on date NOT NULL,
        status text NOT NULL CHECK (status IN ('open','paid','void'))
    );
    CREATE TABLE IF NOT EXISTS app_role (
        role text PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS app_user (
        user_id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenant,
        email text NOT NULL UNIQUE,
        role text NOT NULL REFERENCES app_role,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS fleet (
        fleet_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenant,
        name text NOT NULL,
        depot_city text,
        depot_lat double precision,
        depot_lon double precision,
        UNIQUE (tenant_id, name),
        UNIQUE (fleet_id, tenant_id)
    );
    CREATE TABLE IF NOT EXISTS oem (
        oem_id smallint PRIMARY KEY,
        name text NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS vehicle_model (
        model_id int PRIMARY KEY,
        oem_id smallint NOT NULL REFERENCES oem,
        model_name text NOT NULL,
        model_year smallint NOT NULL,
        powertrain text NOT NULL CHECK (powertrain IN ('ICE','HYBRID','EV')),
        UNIQUE (oem_id, model_name, model_year)
    );
    CREATE TABLE IF NOT EXISTS vehicle (
        vin char(17) PRIMARY KEY,
        fleet_id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        model_id int NOT NULL REFERENCES vehicle_model,
        commissioned_on date NOT NULL,
        status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_service','retired')),
        FOREIGN KEY (fleet_id, tenant_id) REFERENCES fleet (fleet_id, tenant_id)
    );
    CREATE TABLE IF NOT EXISTS driver (
        driver_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        fleet_id uuid NOT NULL REFERENCES fleet,
        display_name text,
        licence_hash text,
        aggressiveness_hint real,
        erased_at timestamptz
    );
    CREATE TABLE IF NOT EXISTS vehicle_assignment (
        assignment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        vin char(17) NOT NULL REFERENCES vehicle,
        driver_id uuid NOT NULL REFERENCES driver,
        valid_from timestamptz NOT NULL,
        valid_to timestamptz
    );
    CREATE TABLE IF NOT EXISTS trip (
        trip_id uuid PRIMARY KEY,
        vin char(17) NOT NULL REFERENCES vehicle,
        tenant_id uuid NOT NULL,
        driver_id uuid REFERENCES driver,
        started_at timestamptz NOT NULL,
        ended_at timestamptz,
        distance_km numeric(8,2),
        harsh_events smallint DEFAULT 0,
        start_geohash char(7),
        end_geohash char(7)
    );
    CREATE TABLE IF NOT EXISTS dtc_code (
        code char(5) PRIMARY KEY,
        system text NOT NULL,
        severity smallint NOT NULL CHECK (severity BETWEEN 1 AND 4),
        description text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alert_rule (
        rule_id text PRIMARY KEY,
        title text NOT NULL,
        default_severity smallint NOT NULL,
        description text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alert (
        alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        dedupe_key text NOT NULL UNIQUE,
        vin char(17) NOT NULL REFERENCES vehicle,
        tenant_id uuid NOT NULL,
        rule_id text NOT NULL REFERENCES alert_rule,
        severity smallint NOT NULL,
        raised_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
        acknowledged_by uuid REFERENCES app_user,
        resolved_at timestamptz,
        evidence jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS work_order (
        wo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vin char(17) NOT NULL REFERENCES vehicle,
        tenant_id uuid NOT NULL,
        alert_id uuid REFERENCES alert,
        created_by uuid NOT NULL REFERENCES app_user,
        source text NOT NULL CHECK (source IN ('human','agent')),
        idempotency_key text,
        status text NOT NULL DEFAULT 'open',
        description text NOT NULL,
        scheduled_for date,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, idempotency_key)
    );
    CREATE TABLE IF NOT EXISTS maintenance_event (
        event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        vin char(17) NOT NULL REFERENCES vehicle,
        occurred_at timestamptz NOT NULL,
        kind text NOT NULL,
        is_breakdown boolean NOT NULL
    );
    CREATE TABLE IF NOT EXISTS model_version (
        model_version text PRIMARY KEY,
        trained_at timestamptz NOT NULL,
        metrics jsonb NOT NULL,
        artifact_uri text NOT NULL,
        is_active boolean NOT NULL DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS risk_score (
        vin char(17) NOT NULL REFERENCES vehicle,
        scored_at timestamptz NOT NULL,
        model_version text NOT NULL REFERENCES model_version,
        risk numeric(5,4) NOT NULL,
        top_factors jsonb NOT NULL,
        PRIMARY KEY (vin, scored_at)
    );
    CREATE TABLE IF NOT EXISTS failure_fingerprint (
        fp_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        vin char(17) NOT NULL REFERENCES vehicle,
        observed_at timestamptz NOT NULL,
        outcome text NOT NULL CHECK (outcome IN ('failed','healthy')),
        embedding vector(32) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
        audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL DEFAULT now(),
        tenant_id uuid,
        actor_type text NOT NULL,
        actor_id text NOT NULL,
        action text NOT NULL,
        resource_type text,
        resource_id text,
        detail jsonb,
        prev_hash bytea,
        row_hash bytea NOT NULL
    );
    CREATE TABLE IF NOT EXISTS erasure_request (
        request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        driver_id uuid NOT NULL,
        requested_by uuid NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        requested_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        certificate jsonb
    );
    CREATE TABLE IF NOT EXISTS agent_run (
        run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        user_id uuid NOT NULL,
        question text NOT NULL,
        status text NOT NULL,
        created_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS agent_step (
        step_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        run_id uuid NOT NULL REFERENCES agent_run,
        step_no int NOT NULL,
        kind text NOT NULL,
        tool text,
        args jsonb,
        result_summary text,
        created_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS agent_proposed_action (
        action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id uuid NOT NULL REFERENCES agent_run,
        tool text NOT NULL,
        args jsonb NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed')),
        decided_by uuid,
        decided_at timestamptz
    );

    CREATE INDEX IF NOT EXISTS idx_alert_open ON alert (tenant_id, severity DESC, raised_at DESC) WHERE status = 'open';
    CREATE INDEX IF NOT EXISTS idx_risk_score ON risk_score (vin, scored_at DESC);
    """)

def seed_data(cur, count=100000):
    print("Seeding reference data...")
    # App Roles
    roles = ['tenant_admin', 'fleet_manager', 'analyst', 'viewer']
    for r in roles:
        cur.execute("INSERT INTO app_role (role) VALUES (%s) ON CONFLICT DO NOTHING;", (r,))

    # Plans
    cur.execute("""
    INSERT INTO plan (plan_id, name, monthly_price_cents, vehicle_limit) VALUES
    (1, 'Starter', 4900, 500),
    (2, 'Growth', 19900, 5000),
    (3, 'Enterprise', 99900, 150000)
    ON CONFLICT DO NOTHING;
    """)

    # Tenants
    tenant_a = "a1111111-1111-1111-1111-111111111111"
    tenant_b = "b2222222-2222-2222-2222-222222222222"
    cur.execute("INSERT INTO tenant (tenant_id, name) VALUES (%s, 'Apex Logistics') ON CONFLICT DO NOTHING;", (tenant_a,))
    cur.execute("INSERT INTO tenant (tenant_id, name) VALUES (%s, 'Blue Dart Express') ON CONFLICT DO NOTHING;", (tenant_b,))

    # Subscriptions
    cur.execute("""
    INSERT INTO subscription (tenant_id, plan_id, status, period_start, period_end) VALUES
    ('a1111111-1111-1111-1111-111111111111', 3, 'active', '2026-01-01', '2027-01-01'),
    ('b2222222-2222-2222-2222-222222222222', 2, 'active', '2026-01-01', '2027-01-01')
    ON CONFLICT DO NOTHING;
    """)

    # Users
    users = [
        ("e0000001-0000-0000-0000-000000000001", tenant_a, "priya@apex.io", "fleet_manager"),
        ("e0000002-0000-0000-0000-000000000002", tenant_a, "ravi@apex.io", "analyst"),
        ("e0000003-0000-0000-0000-000000000003", tenant_a, "anita@apex.io", "tenant_admin"),
        ("e0000004-0000-0000-0000-000000000004", tenant_a, "viewer@apex.io", "viewer"),
        ("e0000005-0000-0000-0000-000000000005", tenant_b, "admin@bluedart.io", "tenant_admin"),
    ]
    for uid, tid, email, role in users:
        cur.execute("""
        INSERT INTO app_user (user_id, tenant_id, email, role) VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING;
        """, (uid, tid, email, role))

    # OEMs & Models
    oems = [(1, 'Tata Motors'), (2, 'Mahindra'), (3, 'Ashok Leyland'), (4, 'Eicher'), (5, 'BharatBenz'), (6, 'Ola Electric')]
    for oid, name in oems:
        cur.execute("INSERT INTO oem (oem_id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (oid, name))

    models = [
        (1, 1, 'Ace EV', 2024, 'EV'),
        (2, 1, 'Signa 4825.TK', 2023, 'ICE'),
        (3, 1, 'Ultra T.7 Hybrid', 2024, 'HYBRID'),
        (4, 2, 'Treo Zor', 2023, 'EV'),
        (5, 2, 'Bolero Maxi Truck', 2022, 'ICE'),
        (6, 3, 'Bada Dost i4', 2023, 'ICE'),
        (7, 3, 'AVTR 5525', 2024, 'HYBRID'),
        (8, 4, 'Pro 2049 EV', 2024, 'EV'),
        (9, 5, '3528C Heavy Duty', 2023, 'ICE'),
        (10, 6, 'Gig EV Cargo', 2025, 'EV'),
    ]
    for mid, oid, mname, myear, ptrain in models:
        cur.execute("""
        INSERT INTO vehicle_model (model_id, oem_id, model_name, model_year, powertrain)
        VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
        """, (mid, oid, mname, myear, ptrain))

    # DTC Codes
    dtcs = [
        ('P0217', 'Cooling System', 4, 'Engine Coolant Over Temperature Condition'),
        ('P0562', 'Electrical', 3, 'System Voltage Low (<11.8V)'),
        ('P0301', 'Ignition', 3, 'Cylinder 1 Misfire Detected'),
        ('P0302', 'Ignition', 3, 'Cylinder 2 Misfire Detected'),
        ('P0521', 'Lubrication', 4, 'Engine Oil Pressure Sensor Range/Performance Low'),
        ('P0128', 'Cooling System', 2, 'Coolant Thermostat Below Regulating Temp'),
        ('U0100', 'Network', 2, 'Lost Communication with ECM/PCM'),
    ]
    for code, sys, sev, desc in dtcs:
        cur.execute("""
        INSERT INTO dtc_code (code, system, severity, description)
        VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;
        """, (code, sys, sev, desc))

    # Alert Rules
    rules = [
        ('R1', 'ENGINE_OVERHEAT', 4, 'Coolant temp sustained >110C for 30s'),
        ('R2', 'BATTERY_12V_LOW', 3, '12V Battery <11.8V while engine on'),
        ('R3', 'DTC_CRITICAL', 4, 'Critical DTC with severity >= 3'),
        ('R4', 'HARSH_DRIVING', 2, '>= 5 harsh driving events in 10 minutes'),
        ('R5', 'EV_SOC_DRAIN', 3, 'EV SoC drop >= 5% while stopped'),
        ('R6', 'EXCESSIVE_IDLE', 1, 'Engine on with speed < 2 km/h for >15 min'),
        ('R7', 'GEOFENCE_BREACH', 3, 'Outside designated geofence cluster'),
        ('R8', 'TELEMETRY_SILENCE', 2, 'No telemetry received for > 300s while moving'),
    ]
    for rid, title, sev, desc in rules:
        cur.execute("""
        INSERT INTO alert_rule (rule_id, title, default_severity, description)
        VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;
        """, (rid, title, sev, desc))

    # 10 Depots / Clusters
    clusters = [
        ('Chennai Central', 13.0827, 80.2707),
        ('Bengaluru Tech Depot', 12.9716, 77.5946),
        ('Mumbai Port Logistics', 19.0760, 72.8777),
        ('Delhi NCR Hub', 28.7041, 77.1025),
        ('Hyderabad Cyber Depot', 17.3850, 78.4867),
        ('Pune Auto Logistics', 18.5204, 73.8567),
        ('Ahmedabad Ring Cargo', 23.0225, 72.5714),
        ('Surat Highway Fleet', 21.1702, 72.8311),
        ('Kolkata East Depot', 22.5726, 88.3639),
        ('Kochi Marine Hub', 9.9312, 76.2673),
    ]

    fleet_ids = []
    print("Seeding 40 fleets across 10 clusters...")
    for i in range(40):
        c_name, lat, lon = clusters[i % len(clusters)]
        f_name = f"Fleet {i+1} - {c_name}"
        f_tid = tenant_a if i < 35 else tenant_b
        cur.execute("""
        INSERT INTO fleet (name, tenant_id, depot_city, depot_lat, depot_lon)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (tenant_id, name) DO UPDATE SET depot_city = EXCLUDED.depot_city
        RETURNING fleet_id, tenant_id;
        """, (f_name, f_tid, c_name, lat, lon))
        fid = cur.fetchone()[0]
        fleet_ids.append((fid, f_tid, lat, lon))

    # Model Version
    cur.execute("""
    INSERT INTO model_version (model_version, trained_at, metrics, artifact_uri, is_active)
    VALUES ('v1.0.0-lightgbm', now(), '{"pr_auc": 0.842, "roc_auc": 0.915, "lead_time_days": 4.6}', 's3://ml-models/v1.0.0-lightgbm.pkl', true)
    ON CONFLICT DO NOTHING;
    """)

    # Check vehicle count
    cur.execute("SELECT count(*) FROM vehicle;")
    existing = cur.fetchone()[0]
    if existing >= count:
        print(f"Postgres already has {existing} vehicles. Skipping bulk vehicle generation.")
        return

    print(f"Generating {count} vehicles with ISO 3779 VINs and check digits...")
    batch_size = 5000
    vehicles = []
    drivers = []
    now = datetime.now(timezone.utc)

    for idx in range(1, count + 1):
        vin = generate_valid_vin(idx)
        fid, tid, _, _ = fleet_ids[idx % len(fleet_ids)]
        mid = (idx % len(models)) + 1
        comm_days = (idx * 17) % 1000
        comm_date = (now - timedelta(days=comm_days)).date()
        vehicles.append((vin, fid, tid, mid, comm_date, 'active'))

        if idx <= 120000:
            d_name = f"Driver #{idx}"
            lic_hash = hashlib.sha256(f"LIC_{idx}".encode()).hexdigest()[:16]
            agg = round(0.1 + (idx % 9) * 0.1, 2)
            drivers.append((str(uuid.uuid4()), fid, d_name, lic_hash, agg))

        if len(vehicles) >= batch_size:
            execute_batch(cur, """
            INSERT INTO vehicle (vin, fleet_id, tenant_id, model_id, commissioned_on, status)
            VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
            """, vehicles)
            vehicles.clear()

        if len(drivers) >= batch_size:
            execute_batch(cur, """
            INSERT INTO driver (driver_id, fleet_id, display_name, licence_hash, aggressiveness_hint)
            VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
            """, drivers)
            drivers.clear()
            print(f"Seeded {idx} / {count} vehicles...")

    if vehicles:
        execute_batch(cur, """
        INSERT INTO vehicle (vin, fleet_id, tenant_id, model_id, commissioned_on, status)
        VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
        """, vehicles)
    if drivers:
        execute_batch(cur, """
        INSERT INTO driver (driver_id, fleet_id, display_name, licence_hash, aggressiveness_hint)
        VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
        """, drivers)

    # Seed top at-risk vehicles and initial alerts for demo
    print("Seeding initial high-risk vehicles and alerts for demo...")
    cur.execute("SELECT vin, tenant_id FROM vehicle LIMIT 200;")
    sample_vins = cur.fetchall()

    risk_records = []
    alerts = []
    fingerprints = []

    for i, (v, tid) in enumerate(sample_vins):
        r_val = round(0.65 + (i % 30) * 0.01, 4) if i < 50 else round(0.05 + (i % 20) * 0.01, 4)
        factors = [
            {"factor": "Coolant Temp Trend", "impact": "+0.34", "detail": "Sustained >108C for 4 days"},
            {"factor": "12V Voltage Sag", "impact": "+0.28", "detail": "Dipped to 11.4V at idle"},
            {"factor": "DTC Frequency", "impact": "+0.18", "detail": "P0301 Cylinder 1 Misfire x8"}
        ]
        risk_records.append((v, now, 'v1.0.0-lightgbm', r_val, json.dumps(factors)))

        # Add alerts for the top 15 vehicles
        if i < 15:
            dkey = f"{v}|R1|{int(now.timestamp())}"
            evidence = json.dumps({"coolant_temp_c": 114.2, "speed_kmh": 68.4, "rpm": 2840})
            alerts.append((dkey, v, tid, 'R1', 4, now - timedelta(minutes=i*4), 'open', evidence))

        # 32-dim failure fingerprints
        random.seed(i)
        vec = [round(random.uniform(-1, 1), 4) for _ in range(32)]
        vec_str = "[" + ",".join(map(str, vec)) + "]"
        outcome = 'failed' if i < 60 else 'healthy'
        fingerprints.append((v, now - timedelta(days=2), outcome, vec_str))

    execute_batch(cur, """
    INSERT INTO risk_score (vin, scored_at, model_version, risk, top_factors)
    VALUES (%s, %s, %s, %s, %s) ON CONFLICT (vin, scored_at) DO NOTHING;
    """, risk_records)

    execute_batch(cur, """
    INSERT INTO alert (dedupe_key, vin, tenant_id, rule_id, severity, raised_at, status, evidence)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (dedupe_key) DO NOTHING;
    """, alerts)

    execute_batch(cur, """
    INSERT INTO failure_fingerprint (vin, observed_at, outcome, embedding)
    VALUES (%s, %s, %s, %s::vector);
    """, fingerprints)

    # Initial audit log entry with SHA256 hash chain
    actor_id = "e0000003-0000-0000-0000-000000000003"
    action = "SEED_INITIALIZATION"
    detail = json.dumps({"vehicles": count, "model": "v1.0.0-lightgbm"})
    prev_hash = b"\x00" * 32
    row_bytes = prev_hash + f"{now.isoformat()}|{tenant_a}|system|{actor_id}|{action}|{detail}".encode()
    row_hash = hashlib.sha256(row_bytes).digest()

    cur.execute("""
    INSERT INTO audit_log (ts, tenant_id, actor_type, actor_id, action, detail, prev_hash, row_hash)
    VALUES (%s, %s, 'system', %s, %s, %s, %s, %s);
    """, (now, tenant_a, actor_id, action, detail, prev_hash, row_hash))

    print(f"Seeding completed successfully! Total registered vehicles: {count}")

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Initializing Postgres schema...")
        init_schema(cur)
        seed_data(cur, count=100000)
    conn.close()

if __name__ == "__main__":
    main()
