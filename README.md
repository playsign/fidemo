fidemo
======

FIWARE Demo / Integration project

How things work
---------------

This repository is for a runtime of the demo: a way to run the code and ability to work on the assets.

Attempts to use a typical sane dir structure -- current is:

data/ -- for models and all related such as materials, textures etc

js/ -- for javascript code / modules, examples ported from the Santander demo are coming here (light vis, heatmap, ..)

index.html is here at root for running locally and for hosting the app on the web at: http://130.206.81.111/fidemo/

it runs main.js which is also at root for now.

Local development and peview
----------------------------

1. Install [node.js](http://nodejs.org/)
2. Run `npm install` on the repo root folder to fetch dependencies.
3. Run `npm install -g grunt-cli` to install the grunt executable as a global tool (only have to do this once per computer)
4. Run `grunt dev`. This will open the index.html in the default OS web browser.

You now have a HTTP server hosting the repository directory. To start the Tundra do the following. Note that any Tundra recently new distribution with WebSocketServerModule will work eg. Meshmoon Rocket, realXtend Tundra or the FIWARE Synchronization GE Tundra distribution.

1. Open a shell/windows cmd prompt
2. nagivate to the Tundra installation folder `cd <tundra-install-dir>` (if Tundra is not installed to the system/PATH)
 * For Windows users the default directory is `C:\Program Files (x86)\realXtend Tundra` or `Meshmoon\Rocket`
3. Run `TundraConsole.exe --headless --server --file http://localhost:8085/scene.txml`
