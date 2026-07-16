FROM alpine:latest

# Install net diagnostic tools
RUN apk add --no-cache \
    tcpdump \
    tshark \
    curl \
    nmap \
    bind-tools \
    iproute2 \
    busybox-extras

WORKDIR /home/user

# Create standard greeting and setup trace flag
RUN echo "Welcome to the networking sniffer lab!" > readme.txt && \
    echo "FLAG{network_pcap_sniff_98}" > flag.txt

CMD ["/bin/sh"]
