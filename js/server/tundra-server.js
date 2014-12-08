var state = "up";

function main()
{
    // Continue context broker etc. implementation to this file.
    console.LogInfo("Hello world from 'fidemo' server script");

    me.Action("TestAction").Triggered.connect(onTestAction);
}

function onTestAction() {
    console.LogInfo("onTestAction");

    var c = scene.EntityByName("Test Cube");
    if (c)
    {
        var y = 0;
        if (state == "up") {
            y = 0;
            state = "down";
        } else {
            y = 250; 
            state = "up";
        }
        c.placeable.SetPosition(0, y, 0);
    }
}

if (server.IsRunning())
    main();
