package com.enonic.xp.app.main.rest.resource.application.json;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.main.rest.resource.application.ApplicationIconUrlResolver;

public class ApplicationJson
{
    private final Application application;

    private final ApplicationDescriptor applicationDescriptor;

    private final boolean local;

    private final String iconUrl;

    public ApplicationJson( final Builder builder )
    {
        this.application = builder.application;
        this.applicationDescriptor = builder.applicationDescriptor;
        this.local = builder.local;
        this.iconUrl = builder.iconUrlResolver.resolve( application.getKey(), applicationDescriptor );
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

    public String getDescription()
    {
        return applicationDescriptor == null ? "" : applicationDescriptor.getDescription();
    }

    public boolean getLocal()
    {
        return local;
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
    {
        private Application application;

        private ApplicationDescriptor applicationDescriptor;

        private ApplicationIconUrlResolver iconUrlResolver;

        private boolean local;

        public ApplicationJson build()
        {
            return new ApplicationJson( this );
        }

        public Builder setApplication( final Application application )
        {
            this.application = application;
            return this;
        }

        public Builder setApplicationDescriptor( final ApplicationDescriptor applicationDescriptor )
        {
            this.applicationDescriptor = applicationDescriptor;
            return this;
        }

        public Builder setIconUrlResolver( final ApplicationIconUrlResolver iconUrlResolver )
        {
            this.iconUrlResolver = iconUrlResolver;
            return this;
        }

        public Builder setLocal( final boolean local )
        {
            this.local = local;
            return this;
        }
    }

}
