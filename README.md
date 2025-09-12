# AI Tour Guide

## Environment variables

Create a `.env` file in the repo root (Expo reads `EXPO_PUBLIC_*` at build time) based on `.env.example`.

Frontend:

- EXPO_PUBLIC_API_URL – REST API base including `/api/v1`, e.g. `https://your-api.example.com/api/v1`
- EXPO_PUBLIC_WS_URL – Optional override for websocket, e.g. `wss://your-api.example.com/api/v1/guide/stream`
