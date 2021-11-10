#!/bin/bash
npm run build
tsc test/scores-sfi.ts
node test/scores-sfi.js
