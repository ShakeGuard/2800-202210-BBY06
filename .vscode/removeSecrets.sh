#!/bin/sh

# This script assumes that it's being launched from the VSCode workspace root, 
# i.e. the directory containing the `.git` and `.vscode` subdirectories.
# Assert that's the case, exit if it isn't:
[ -d "$PWD/.git" ] || { echo ".git directory doesn't exist! Make sure you're in the correct directory." >&2; exit 1; }
[ -d "$PWD/.vscode" ] || { echo ".vscode directory doesn't exist! Make sure you're in the correct directory." >&2; exit 1; }

# "File exists" check adapted from StackOverflow answer https://stackoverflow.com/a/42097368 by Charles Duffy.
# Thanks, Charles!

# Remove the .secrets directory
if rm -r .secrets; then
    echo "Removed .secrets successfully."
else
    echo "Could not remove .secrets: does it exist?"
fi