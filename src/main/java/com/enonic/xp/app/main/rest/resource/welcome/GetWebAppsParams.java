package com.enonic.xp.app.main.rest.resource.welcome;

public class GetWebAppsParams
{
    private String serverName;

    private String scheme;

    private int port;

    public String getServerName()
    {
        return serverName;
    }

    public void setServerName( final String serverName )
    {
        this.serverName = serverName;
    }

    public String getScheme()
    {
        return scheme;
    }

    public void setScheme( final String scheme )
    {
        this.scheme = scheme;
    }

    public int getPort()
    {
        return port;
    }

    public void setPort( final int port )
    {
        this.port = port;
    }
}
