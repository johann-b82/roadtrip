FROM osrm/osrm-backend:latest
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
WORKDIR /data
COPY start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=300s \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1
CMD ["/start.sh"]
