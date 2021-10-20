package com.enonic.xp.app.main.rest.resource.welcome;

import com.enonic.xp.app.Application;

public class WebApplication
{
    private final Application application;

    private final String deploymentUrl;

    private WebApplication( final Builder builder )
    {
        this.application = builder.application;
        this.deploymentUrl = builder.developmentUrl;
    }

    public String getKey()
    {
        return application.getKey().toString();
    }

    public String getVersion()
    {
        return application.getVersion().toString();
    }

    public String getUrl()
    {
        return application.getUrl();
    }

    public String getDisplayName()
    {
        return application.getDisplayName();
    }

    public String getDeploymentUrl()
    {
        return deploymentUrl;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
    {
        Application application;

        String developmentUrl;

        public Builder application( final Application application )
        {
            this.application = application;
            return this;
        }

        public Builder deploymentUrl( final String developmentUrl )
        {
            this.developmentUrl = developmentUrl;
            return this;
        }

        public WebApplication build()
        {
            return new WebApplication( this );
        }
    }
}
