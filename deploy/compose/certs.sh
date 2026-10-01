#!/bin/bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/certs"
mkdir -p "$DIR"
cd "$DIR"

if [ ! -f "ca.key" ]; then
  echo "Generating Dev Root CA..."
  openssl genrsa -out ca.key 2048
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
    -subj "/C=IN/ST=TamilNadu/L=Chennai/O=FleetGuard/CN=FleetGuard-Dev-CA"
fi

# Gateway server cert
if [ ! -f "server.key" ]; then
  echo "Generating Gateway Server Certificate..."
  openssl genrsa -out server.key 2048
  openssl req -new -key server.key -out server.csr \
    -subj "/C=IN/ST=TamilNadu/L=Chennai/O=FleetGuard/CN=gateway"
  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out server.crt -days 365 -sha256
fi

# Tenant A Simulator Client cert
TENANT_A="a1111111-1111-1111-1111-111111111111"
if [ ! -f "client-tenant-a.key" ]; then
  echo "Generating Tenant A Simulator Client Certificate..."
  openssl genrsa -out client-tenant-a.key 2048
  openssl req -new -key client-tenant-a.key -out client-tenant-a.csr \
    -subj "/C=IN/ST=TamilNadu/L=Chennai/O=FleetGuard/CN=tenant:${TENANT_A}"
  openssl x509 -req -in client-tenant-a.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out client-tenant-a.crt -days 365 -sha256
fi

# Tenant B Simulator Client cert
TENANT_B="b2222222-2222-2222-2222-222222222222"
if [ ! -f "client-tenant-b.key" ]; then
  echo "Generating Tenant B Simulator Client Certificate..."
  openssl genrsa -out client-tenant-b.key 2048
  openssl req -new -key client-tenant-b.key -out client-tenant-b.csr \
    -subj "/C=IN/ST=TamilNadu/L=Chennai/O=FleetGuard/CN=tenant:${TENANT_B}"
  openssl x509 -req -in client-tenant-b.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out client-tenant-b.crt -days 365 -sha256
fi

echo "Certificates generated successfully in $DIR."
