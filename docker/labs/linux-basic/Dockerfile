FROM ubuntu:22.04

# Install standard utilities
RUN apt-get update && apt-get install -y \
    bash \
    coreutils \
    nano \
    sudo \
    curl \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Add a user and configure permissions
RUN useradd -m -s /bin/bash user && \
    echo "user:userpass" | chpasswd && \
    adduser user sudo

WORKDIR /home/user

# Setup the lab task files and flag
RUN echo "Welcome to the Linux basics lab! Can you find the hidden flag file?" > readme.txt && \
    echo "FLAG{cyber_arena_permissions_101}" > flag.txt && \
    chown root:root flag.txt && \
    chmod 600 flag.txt

USER user
CMD ["/bin/bash"]
