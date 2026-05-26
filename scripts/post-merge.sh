#!/bin/bash
set -e

bun install --frozen-lockfile 2>/dev/null || bun install
