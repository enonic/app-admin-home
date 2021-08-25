package com.enonic.xp.app.main.rest.resource.application;

import java.net.URL;
import java.time.Instant;

import javax.ws.rs.core.MediaType;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.ArgumentMatchers;
import org.osgi.framework.Version;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.app.Applications;
import com.enonic.xp.app.main.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.idprovider.IdProviderDescriptor;
import com.enonic.xp.idprovider.IdProviderDescriptorService;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class MainApplicationResourceTest
    extends AdminResourceTestSupport
{
    private ApplicationService applicationService;

    private ApplicationDescriptorService applicationDescriptorService;

    private SiteService siteService;

    private IdProviderDescriptorService idProviderDescriptorService;

    private MixinService mixinService;

    @Test
    public void getApplicationList()
        throws Exception
    {
        final Application application = createApplication();
        final Applications applications = Applications.from( application );
        when( this.applicationService.getInstalledApplications() ).thenReturn( applications );
        final SiteDescriptor siteDescriptor = createSiteDescriptor();
        when( this.siteService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( siteDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( "application/list" ).
            get().getAsString();
        assertJson( "get_application_list_success.json", response );
    }

    @Test
    public void getApplicationListWithQuery()
        throws Exception
    {
        final Application application = createApplication();
        final Applications applications = Applications.from( application, createEmptyApplication() );
        when( this.applicationService.getInstalledApplications() ).thenReturn( applications );
        final SiteDescriptor siteDescriptor = createSiteDescriptor();
        when( this.siteService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( siteDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( "application/list" ).
            queryParam( "query", "Enonic" ).
            get().getAsString();
        assertJson( "get_application_list_success.json", response );
    }

    @Test
    public void getApplicationListWithInvalidQuery()
        throws Exception
    {
        final Application application = createApplication();
        final Applications applications = Applications.from( application, createEmptyApplication() );
        when( this.applicationService.getInstalledApplications() ).thenReturn( applications );
        final SiteDescriptor siteDescriptor = createSiteDescriptor();
        when( this.siteService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( siteDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        String response = request().
            path( "application/list" ).
            queryParam( "query", "invalid query" ).
            get().getAsString();
        assertJson( "get_application_list_with_invalid_query.json", response );
    }

    @Test
    public void installUrlInvalidUrl()
        throws Exception
    {
        String response = request().
            path( "application/installUrl" ).
            entity( "{\"URL\":\"" + "http://enonic.net" + "\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        Assertions.assertEquals( "{\"applicationInstalledJson\":null,\"failure\":\"Failed to process application from http://enonic.net\"}",
                                 response );
    }

    @Test
    public void installUrlInvalidProtocol()
        throws Exception
    {
        String response = request().
            path( "application/installUrl" ).
            entity( "{\"URL\":\"" + "inv://enonic.net" + "\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        Assertions.assertEquals( "{\"applicationInstalledJson\":null,\"failure\":\"Failed to upload application from inv://enonic.net\"}",
                                 response );
    }

    @Test
    public void installUrlNotAllowedProtocol()
        throws Exception
    {
        String response = request().
            path( "application/installUrl" ).
            entity( "{\"URL\":\"" + "ftp://enonic.net" + "\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        Assertions.assertEquals( "{\"applicationInstalledJson\":null,\"failure\":\"Illegal protocol: ftp\"}", response );
    }

    @Test
    public void installUrl()
        throws Exception
    {
        final Application application = createApplication();
        when(
            this.applicationService.installGlobalApplication( ArgumentMatchers.eq( new URL( application.getUrl() ) ), any() ) ).thenReturn(
            application );

        String response = request().
            path( "application/installUrl" ).
            entity( "{\"URL\":\"" + application.getUrl() + "\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();
        assertJson( "install_url.json", response );
    }

    private Application createApplication()
    {
        final Application application = mock( Application.class );
        when( application.getKey() ).thenReturn( ApplicationKey.from( "testapplication" ) );
        when( application.getVersion() ).thenReturn( new Version( 1, 0, 0 ) );
        when( application.getDisplayName() ).thenReturn( "application display name" );
        when( application.getUrl() ).thenReturn( "http://enonic.net" );
        when( application.getVendorName() ).thenReturn( "Enonic" );
        when( application.getVendorUrl() ).thenReturn( "https://www.enonic.com" );
        when( application.getMinSystemVersion() ).thenReturn( "5.0" );
        when( application.getMaxSystemVersion() ).thenReturn( "5.1" );
        when( application.isStarted() ).thenReturn( true );
        when( application.getModifiedTime() ).thenReturn( Instant.parse( "2012-01-01T00:00:00.00Z" ) );

        return application;
    }

    private ApplicationDescriptor createApplicationDescriptor()
    {
        return createApplicationDescriptor( null );
    }

    private ApplicationDescriptor createApplicationDescriptor( final Icon icon )
    {
        return ApplicationDescriptor.create().
            key( ApplicationKey.from( "testapplication" ) ).
            description( "Application description" ).
            icon( icon ).
            build();
    }

    private Application createEmptyApplication()
    {
        final Application application = mock( Application.class );
        when( application.getDisplayName() ).thenReturn( "empty name" );
        when( application.getKey() ).thenReturn( ApplicationKey.from( "empty_testapplication" ) );
        return application;
    }

    private SiteDescriptor createSiteDescriptor()
    {
        final Form config = Form.create().
            addFormItem( Input.create().name( "some-name" ).label( "some-label" ).helpTextI18nKey( "site.config.helpText" ).labelI18nKey(
                "site.config.label" ).inputType( InputTypeName.TEXT_LINE ).build() ).
            build();

        return SiteDescriptor.create().form( config ).build();
    }

    private IdProviderDescriptor createIdProviderDescriptor()
    {
        final Form config = Form.create().
            addFormItem( Input.create().name( "some-name" ).label( "some-label" ).labelI18nKey( "key.label" ).helpTextI18nKey(
                "key.help-text" ).inputType( InputTypeName.TEXT_LINE ).build() ).
            build();
        return IdProviderDescriptor.create().
            config( config ).
            build();
    }

    @Override
    protected Object getResourceInstance()
    {
        this.applicationService = mock( ApplicationService.class );
        this.applicationDescriptorService = mock( ApplicationDescriptorService.class );
        this.siteService = mock( SiteService.class );
        this.idProviderDescriptorService = mock( IdProviderDescriptorService.class );
        this.mixinService = mock( MixinService.class );

        final MainApplicationResource resource = new MainApplicationResource();
        resource.setApplicationService( this.applicationService );
        resource.setApplicationDescriptorService( this.applicationDescriptorService );

        return resource;
    }
}
