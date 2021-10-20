package com.enonic.xp.app.main.rest.resource.welcome;

import java.util.List;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public class WebApplicationsMapper
    implements MapSerializable
{
    private final List<WebApplication> applications;

    WebApplicationsMapper( final List<WebApplication> applications )
    {
        this.applications = applications;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.array( "applications" );
        applications.forEach( application -> {
            gen.map();
            gen.value( "displayName", application.getDisplayName() );
            gen.value( "applicationKey", application.getKey() );
            gen.value( "version", application.getVersion() );
            gen.value( "url", application.getUrl() );
            gen.value( "deploymentUrl", application.getDeploymentUrl() );
            gen.end();
        } );
        gen.end();
    }
}
