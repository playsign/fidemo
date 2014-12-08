// Randomizes color of the avatar's material from the colors listed in 'availableColors' attribute'.
// It's up for the client to actually apply the color.

if (server.IsRunning())
{
    var avatarData = me.Component(25, "AvatarData");
    if (avatarData && avatarData.availableColors && avatarData.color)
    {
        avatarData.color = Color.FromString(avatarData.availableColors[Math.floor((Math.random()*avatarData.availableColors.length))]);
    }
}
