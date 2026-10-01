CREATE DATABASE IF NOT EXISTS fleetguard;

CREATE TABLE IF NOT EXISTS fleetguard.telemetry (
  tenant_id UUID,
  fleet_id UUID,
  event_id UUID,
  vin FixedString(17),
  ts DateTime64(3,'UTC') CODEC(Delta, ZSTD),
  received_at DateTime64(3,'UTC'),
  seq UInt32,
  lat Float32 CODEC(Gorilla, ZSTD),
  lon Float32 CODEC(Gorilla, ZSTD),
  speed_kmh Float32 CODEC(Gorilla, ZSTD),
  rpm Nullable(UInt16),
  engine_on UInt8,
  coolant_temp_c Nullable(Float32) CODEC(Gorilla, ZSTD),
  battery_12v Float32 CODEC(Gorilla, ZSTD),
  oil_pressure_kpa Nullable(Float32),
  fuel_pct Nullable(Float32),
  soc_pct Nullable(Float32),
  soh_pct Nullable(Float32),
  odo_km Float64 CODEC(Delta, ZSTD),
  dtc Array(LowCardinality(String)),
  evt LowCardinality(String)
)
ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMMDD(ts)
ORDER BY (tenant_id, vin, ts, seq)
TTL toDateTime(ts) + INTERVAL 3 DAY TO VOLUME 'warm', toDateTime(ts) + INTERVAL 30 DAY DELETE
SETTINGS storage_policy = 'hot_warm';

CREATE TABLE IF NOT EXISTS fleetguard.telemetry_1m (
  tenant_id UUID,
  vin FixedString(17),
  minute DateTime,
  n AggregateFunction(count),
  speed_avg AggregateFunction(avg, Float32),
  coolant_max AggregateFunction(max, Nullable(Float32)),
  batt_min AggregateFunction(min, Float32),
  soc_min AggregateFunction(min, Nullable(Float32)),
  dtc_n SimpleAggregateFunction(sum, UInt64),
  harsh_n SimpleAggregateFunction(sum, UInt64),
  dist_max_odo SimpleAggregateFunction(max, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(minute)
ORDER BY (tenant_id, vin, minute)
TTL minute + INTERVAL 30 DAY;

CREATE TABLE IF NOT EXISTS fleetguard.telemetry_1h (
  tenant_id UUID,
  vin FixedString(17),
  hour DateTime,
  n AggregateFunction(count),
  speed_avg AggregateFunction(avg, Float32),
  coolant_max AggregateFunction(max, Nullable(Float32)),
  batt_min AggregateFunction(min, Float32),
  soc_min AggregateFunction(min, Nullable(Float32)),
  dtc_n SimpleAggregateFunction(sum, UInt64),
  harsh_n SimpleAggregateFunction(sum, UInt64),
  dist_max_odo SimpleAggregateFunction(max, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(hour)
ORDER BY (tenant_id, vin, hour)
TTL hour + INTERVAL 13 MONTH;
