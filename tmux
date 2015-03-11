#!/bin/bash

SESSIONNAME="tyb-api"

DEFAULT_ACTION="start"

DEFAULT_CMD="start"
NPM_CMD=${2:-$DEFAULT_CMD}

DEFAULT_PATH="$HOME/api"
CD_PATH=${3:-$DEFAULT_PATH}

if [ $1 = "start" ] ; then
    tmux new -s $SESSIONNAME -n api -d
    tmux send-keys -t $SESSIONNAME "cd $CD_PATH && npm run $NPM_CMD" C-m
fi

if [ $1 = "stop" ] ; then
    tmux kill-session -t $SESSIONNAME
fi

if [ $1 = "attach" ] ; then
    tmux a -t $SESSIONNAME
fi