package com.enonic.xp.app.main;

import com.enonic.xp.server.ServerInfo;

public final class GetBuildShortHashScriptBean
{
    private static final String NA = "N/A";

    public String execute()
    {
        final String shortHash = ServerInfo.get().getBuildInfo().getShortHash();
        return shortHash.isBlank() || NA.equals( shortHash ) ? null : shortHash;
    }
}
