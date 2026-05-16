# Use Node.js 20 on Debian (has apt for installing Java + Python)
FROM node:20-slim

# Install Java JDK and Python3
RUN apt-get update && apt-get install -y \
    default-jdk \
    python3 \
    python3-pip \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH="$JAVA_HOME/bin:$PATH"
# Use python3 as default python
ENV PYTHON_BIN=python3

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

EXPOSE 4000

CMD ["node", "server.js"]
