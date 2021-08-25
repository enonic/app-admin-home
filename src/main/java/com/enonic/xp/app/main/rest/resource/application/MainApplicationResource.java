package com.enonic.xp.app.main.rest.resource.application;

import java.io.IOException;
import java.net.URL;
import java.util.Comparator;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.util.concurrent.Striped;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.app.Applications;
import com.enonic.xp.app.main.rest.resource.ResourceConstants;
import com.enonic.xp.app.main.rest.resource.application.json.ApplicationInstallParams;
import com.enonic.xp.app.main.rest.resource.application.json.ApplicationInstallResultJson;
import com.enonic.xp.app.main.rest.resource.application.json.ApplicationInstalledJson;
import com.enonic.xp.app.main.rest.resource.application.json.ApplicationJson;
import com.enonic.xp.app.main.rest.resource.application.json.ListApplicationJson;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.util.Exceptions;
import com.enonic.xp.util.HexEncoder;

import static com.google.common.base.Strings.nullToEmpty;

@Path(ResourceConstants.REST_ROOT + "application")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2main")
public final class MainApplicationResource
    implements JaxRsComponent
{
    private static final Set<String> ALLOWED_PROTOCOLS = Set.of( "http", "https" );

    private static final Logger LOG = LoggerFactory.getLogger( MainApplicationResource.class );

    private static final Striped<Lock> LOCK_STRIPED = Striped.lazyWeakLock( 100 );

    private ApplicationService applicationService;

    private ApplicationDescriptorService applicationDescriptorService;

    private final ApplicationIconUrlResolver iconUrlResolver;

    public MainApplicationResource()
    {
        iconUrlResolver = new ApplicationIconUrlResolver();
    }

    @GET
    @Path("list")
    public ListApplicationJson list( @QueryParam("query") final String query )
        throws Exception
    {
        Applications applications = this.applicationService.getInstalledApplications();

        applications = this.filterApplications( applications, query );
        applications = this.sortApplications( applications );

        final ListApplicationJson json = new ListApplicationJson();
        for ( final Application application : applications )
        {
            final ApplicationKey applicationKey = application.getKey();
            if ( !application.isSystem() )
            {
                final boolean localApplication = this.applicationService.isLocalApplication( applicationKey );
                final ApplicationDescriptor appDescriptor = this.applicationDescriptorService.get( applicationKey );

                json.add( ApplicationJson.create().
                    setApplication( application ).
                    setLocal( localApplication ).
                    setIconUrlResolver( this.iconUrlResolver ).
                    setApplicationDescriptor( appDescriptor ).
                    build() );
            }
        }

        return json;
    }

    @POST
    @Path("installUrl")
    @RolesAllowed(RoleKeys.ADMIN_ID)
    @Consumes(MediaType.APPLICATION_JSON)
    public ApplicationInstallResultJson installUrl( final ApplicationInstallParams params )
        throws Exception
    {
        final String urlString = params.getUrl();
        final byte[] sha512 = Optional.ofNullable( params.getSha512() ).map( HexEncoder::fromHex ).orElse( null );
        final ApplicationInstallResultJson result = new ApplicationInstallResultJson();
        String failure;
        try
        {
            final URL url = new URL( urlString );

            if ( ALLOWED_PROTOCOLS.contains( url.getProtocol() ) )
            {
                return lock( url, () -> installApplication( url, sha512 ) );
            }
            else
            {
                failure = "Illegal protocol: " + url.getProtocol();
                result.setFailure( failure );

                return result;
            }

        }
        catch ( IOException e )
        {
            LOG.error( failure = "Failed to upload application from " + urlString, e );
            result.setFailure( failure );
            return result;
        }
    }

    private ApplicationInstallResultJson installApplication( final URL url, final byte[] sha512 )
    {
        final ApplicationInstallResultJson result = new ApplicationInstallResultJson();

        try
        {
            final Application application = this.applicationService.installGlobalApplication( url, sha512 );

            result.setApplicationInstalledJson( new ApplicationInstalledJson( application, false, iconUrlResolver ) );
        }
        catch ( Exception e )
        {
            final String failure = "Failed to process application from " + url;
            LOG.error( failure, e );

            result.setFailure( failure );
        }
        return result;
    }

    private Applications sortApplications( final Applications applications )
    {
        return Applications.from( applications.stream().
            sorted( Comparator.comparing( Application::getDisplayName ) ).
            collect( Collectors.toList() ) );
    }

    private Applications filterApplications( final Applications applications, final String query )
    {
        if ( !nullToEmpty( query ).isBlank() )
        {
            final String queryLowercase = query.toLowerCase();
            return Applications.from( applications.stream().
                filter( application -> nullToEmpty( application.getDisplayName() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getMaxSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getMinSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getUrl() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getVendorName() ).toLowerCase().contains( queryLowercase ) ||
                    nullToEmpty( application.getVendorUrl() ).toLowerCase().contains( queryLowercase ) ).
                collect( Collectors.toList() ) );
        }

        return applications;
    }

    private <V> V lock( Object key, Callable<V> callable )
    {
        final Lock lock = LOCK_STRIPED.get( key );
        try
        {
            if ( lock.tryLock( 30, TimeUnit.MINUTES ) )
            {
                try
                {
                    return callable.call();
                }
                catch ( Exception e )
                {
                    throw Exceptions.unchecked( e );
                }
                finally
                {
                    lock.unlock();
                }
            }
            else
            {
                throw new RuntimeException( "Failed to acquire application service lock for application [" + key + "]" );
            }
        }
        catch ( InterruptedException e )
        {
            throw new RuntimeException( "Failed to acquire application service lock for application [" + key + "]", e );
        }
    }

    @Reference
    public void setApplicationService( final ApplicationService applicationService )
    {
        this.applicationService = applicationService;
    }

    @Reference
    public void setApplicationDescriptorService( final ApplicationDescriptorService applicationDescriptorService )
    {
        this.applicationDescriptorService = applicationDescriptorService;
    }
}

