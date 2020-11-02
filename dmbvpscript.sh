#!/bin/bash
# runs a node script that saves output to files in the direcotry:
#   PvDMB_data
# each file is saved as a js file


# syntax: script [pages of results]
phishID=54
dmbID=283

echo "Starting Node Script"
node index.js $1 Phish $phishID
node index.js $1 Dave_Matthews_Band $dmbID
echo "Done!"



