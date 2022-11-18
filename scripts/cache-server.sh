#!/usr/bin/env bash

CACHE_SERVER_DIR="$(dirname "$0")/../cache-server"

build() {
    echo "Rebuilding cache-server..."
    docker build "$CACHE_SERVER_DIR" -t 'gha-cache-server'
}

start() {
    echo "Starting cache-server..."
    docker run \
        --name cache-server \
        --rm \
        --network host \
        -e AUTH_KEY=token \
        -e PORT=22243 \
        -d \
        gha-cache-server
}

stop() {
    echo "Stopping cache-server..."
    docker stop cache-server
}

restart() {
    stop
    start
}

usage() {
    cat<<USAGE
Usage:
    $0 command
Commands:
    build   Build the cache-server image
    start   Start the cache-server
    stop    Stop the cache-server
    restart Retart the cache-server
USAGE
}

_command="$1"

case "$_command" in
    build|start|stop|restart)
        $_command
        ;;
    *)
        usage
        exit 1
esac
