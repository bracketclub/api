#!/bin/bash

SESSIONNAME="tyb-api"

if [ $1 = "start" ] ; then
    tmux new -s $SESSIONNAME -n api -d
    tmux send-keys -t $SESSIONNAME "cd $HOME/api && npm start" C-m
fi

if [ $1 = "stop" ] ; then
    tmux kill-session -t $SESSIONNAME
fi