#!/bin/bash
# Feel free to modify these locations
API_DIR="/mnt/sto/proyectos/showmethemoney/backend/"
COMMON_LOG="$API_DIR../backend.log"
ERROR_LOG="$API_DIR../backend.log"
NODE_BINARY="nodejs"

# Avoid touching anything below this unless
# you are really sure what you are doing.
API_LAUNCHER="server.js"

showuse(){
	echo "Usage: $0 {start|stop|status|restart}"
}

start(){
	STATUS=$(forever list | grep $API_DIR$API_LAUNCHER)
	if [ -n "$STATUS" ]
	then
		echo "API already running"
		exit
	else
		forever start --minUptime 1000 --spinSleepTime 1000 -o $COMMON_LOG -e $ERROR_LOG -c $NODE_BINARY -a $AA_API_DIR$AA_API_LAUNCHER
	fi
}

stop(){
	forever stop $API_DIR$API_LAUNCHER
}

status(){
	STATUS=$(forever list | grep $API_DIR$API_LAUNCHER)
	if [ -n "$STATUS" ]
	then
		echo $STATUS
	else
		echo "API not running"
	fi
}

case "$1" in
    start)
		start
        ;;
    stop)
		stop
        ;;
    status)
		status
		;;
    restart)
		stop
		start
		;;
	*)
		showuse
		;;
esac
