#!/bin/sh
nohup nodejs server.js &
echo $! > pid
