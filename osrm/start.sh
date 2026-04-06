#!/bin/sh
set -e

cd /data

# Download Europe extract if not present (~2.5GB, one-time download)
if [ ! -f "europe-latest.osm.pbf" ]; then
  echo "Downloading Europe extract from Geofabrik (~2.5GB)..."
  wget -q --show-progress https://download.geofabrik.de/europe-latest.osm.pbf
fi

# Extract road network (one-time, results cached in /data volume)
if [ ! -f "europe-latest.osrm" ]; then
  echo "Extracting road network (this takes 15-30 min first run)..."
  osrm-extract -p /opt/osrm/profiles/car.lua europe-latest.osm.pbf
fi

# Partition for MLD algorithm
if [ ! -f "europe-latest.osrm.partition" ]; then
  echo "Partitioning..."
  osrm-partition europe-latest.osrm
fi

# Customize
if [ ! -f "europe-latest.osrm.cell_metrics" ]; then
  echo "Customizing..."
  osrm-customize europe-latest.osrm
fi

echo "Starting OSRM routing server..."
exec osrm-routed --algorithm=MLD --max-table-size=8000 europe-latest.osrm
