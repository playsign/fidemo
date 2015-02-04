fidemo - a FIWARE Demo / Integration project
============================================

Live demo: http://130.206.81.111/fidemo/ (hosted in FIWARE Lab)

What's this FIDEMO?
---------------------------------

This is a demo of integration of WebGL based 3D city visualization and Open Data with live updates.

We use several FIWARE technologies. Currently this first version features Context Broker & WebUI integration.

Scenario: City of Helsinki
--------------------------

Features:

- buildings automatically from map data (GIS/OSM)
- real-time public traffic data (from the transit company)
- cafes, shops etc. (also from Openstreetmaps (OSM))
- Open311 issues from Context Broker (‘fix the city’ in HKI)
- Building prices (Finnish Statistics Open Data)
- adding comments to POIs to Context Broker (Orion)

The data sources
----------------

For traffic (to here via CIE's POI server):

There are separate open data servers for Helsinki and Tampere.

- Helsinki data is obtained from 
 - http://dev.hsl.fi/siriaccess/vm/json?operatorRef=HSL

- Tampere data is obtained from
  - http://data.itsfactory.fi/siriaccess/vm/json .

Official Helsinki page for extra info
- http://dev.hsl.fi/

Official Tampere page for extra info incl. license
- http://wiki.itsfactory.fi/index.php/Tampere_Public_Transport_SIRI_Interface_%28Realtime_JSON_at_data.itsfactory.fi%29

The data is SIRI ( http://user47094.vs.easily.co.uk/siri/ ) data converted to JSON format.

Development setup
-----------------

This repository is for a runtime of the demo: a way to run the code and ability to work on the assets.

Attempts to use a typical sane dir structure -- current is:

data/ -- for models and all related such as materials, textures etc

js/ -- for javascript code / modules, examples ported from the Santander demo are coming here (light vis, heatmap, ..)

index.html is here at root for running locally and for hosting the app on the web at: http://130.206.81.111/fidemo/

it runs main.js which is also at root for now.

Local development and preview
----------------------------

The application can be opened locally by just opening index.html with a browser. However, browsers don't allow JS code to load external files that way so you need to start e.g. Chrome with the --allow-file-access-from-files option as described in http://www.chrome-allow-file-access-from-file.com/

Other option is to use a Web server locally to provide the files for your browser. This way you can use the browser normally, no extra start flags are required. An easy to install Web server is node.js:

1. Install [node.js](http://nodejs.org/)
2. Run `npm install` on the repo root folder to fetch dependencies.
3. Run `npm install -g grunt-cli` to install the grunt executable as a global tool (only have to do this once per computer)
4. Run `grunt dev`. This will open the index.html in the default OS web browser.

You now have a HTTP server hosting the repository directory. This works to work on the scene: add meshes, configure lights, work on the Javascript code etc.

Running Tundra server for realtime multiuser functionality
----------------------------------------------------------

To work on multiuser features in the application you need to run the Tundra server as well.

To start the Tundra do the following. Note that any Tundra recently new distribution with WebSocketServerModule will work eg. Meshmoon Rocket, realXtend Tundra or the FIWARE Synchronization GE Tundra distribution.

1. Open a shell/windows cmd prompt
2. nagivate to the Tundra installation folder `cd <tundra-install-dir>` (if Tundra is not installed to the system/PATH)
 * For Windows users the default directory is `C:\Program Files (x86)\realXtend Tundra` or `Meshmoon\Rocket`
3. Run 
 * Windows: `TundraConsole.exe --headless --server --file http://localhost:8085/scene.txml`
 * Linux/Mac: `./Tundra --headless --server --file http://localhost:8085/scene.txml`

Starting the demo on the current demo server (filab)
---------------------------------------------------

We now run on Ludocraft's filab VM, like this:

`lc-test2:/opt/realxtend-tundra# xvfb-run -a ./Tundra --headless --server --port 2346 --file http://130.206.81.111/fidemo/scene.txml`

The loading-txml-over-http trick is to override the current prob in tundra-webtundra storage biz that would otherwise inject local: prefixes to the asset refs.
