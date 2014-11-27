
module.exports = function(grunt) {

    grunt.initConfig({
        pkg : grunt.file.readJSON("package.json"),

        connect : {
            app : {
                options: {
                    port : 8085,
                    keepalive : true,
                    base : "./",
                    open : (grunt.option("no-browser") ? false : "http://localhost:8085/index.html")
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("dev", "", [
        "connect:app"
    ]);
    grunt.registerTask("default", [
        "dev"
    ]);
};
