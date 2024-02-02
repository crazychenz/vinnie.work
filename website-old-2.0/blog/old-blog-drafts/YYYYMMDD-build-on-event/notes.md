sudo apt-get install -y notify-tools

inotifywait -m -r src |
while read fvar1 var2 var3; do # do stuff
done

https://github.com/emcrisostomo/fswatch

sudo apt-get install -y fswatch

fswatch -0 path | while read -d "" event \
 do \
 // do something with \${event}
done

g
