package com.enonic.xp.app.main.rest.resource.application.json;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.main.rest.resource.application.ApplicationIconUrlResolver;

public class ApplicationInstalledJson
{
    private final ApplicationJson application;

    public ApplicationInstalledJson( final Application application, final boolean local, final ApplicationIconUrlResolver iconUrlResolver )
    {
        this.application = ApplicationJson.create().
            setApplication( application ).
            setLocal( local ).
            setIconUrlResolver( iconUrlResolver ).
            build();
    }

    @SuppressWarnings("unused")
    public ApplicationJson getApplication()
    {
        return application;
    }
}

