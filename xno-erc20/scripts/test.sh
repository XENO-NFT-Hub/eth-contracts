#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
    # Kill the ganache instance that we started (if we started one and if it's still running).
    if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
        kill -9 $ganache_pid
    fi
}

ganache_port=7545 # this needs to change if you intend to run ganache on another port

ganache_mnemonic="logic episode nut illness vacant cover animal globe shed sound shop belt"

ganache_running() {
    nc -z localhost "$ganache_port"
}

start_ganache() {

    # start ganache-cli with 12.5M gas limit (same as live network) and our defined accounts
    npx ganache-cli -a 20 -e 10000 --chainId 1337 --gasLimit 0xBEBC20 --port "$ganache_port" --mnemonic "$ganache_mnemonic" > /dev/null &
    
    ganache_pid=$!

    echo "Waiting for ganache to launch on port "$ganache_port"..."

    while ! ganache_running; do
        sleep 0.1 # wait for 1/10 of a second before check again
    done

    echo "Ganache launched!"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

npx truffle version
npx truffle test --network development "$@"