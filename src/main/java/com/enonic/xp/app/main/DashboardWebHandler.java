package com.enonic.xp.app.main;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.controller.ControllerScript;
import com.enonic.xp.portal.controller.ControllerScriptFactory;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.web.WebRequest;
import com.enonic.xp.web.WebResponse;
import com.enonic.xp.web.handler.BaseWebHandler;
import com.enonic.xp.web.handler.WebHandler;
import com.enonic.xp.web.handler.WebHandlerChain;

@Component(immediate = true, service = WebHandler.class)
public class DashboardWebHandler
    extends BaseWebHandler
{

    private final ControllerScriptFactory controllerScriptFactory;

    @Activate
    public DashboardWebHandler( final @Reference ControllerScriptFactory controllerScriptFactory )
    {
        super( 99 );
        this.controllerScriptFactory = controllerScriptFactory;
    }

    @Override
    protected boolean canHandle( final WebRequest webRequest )
    {
        return webRequest.getRawPath().equals( "/" );
    }

    @Override
    protected WebResponse doHandle( final WebRequest webRequest, final WebResponse webResponse, final WebHandlerChain webHandlerChain )
    {
        PortalRequest portalRequest = new PortalRequest( webRequest );
        portalRequest.setContextPath( portalRequest.getBaseUri() );

        ResourceKey scriptDir = ResourceKey.from( ApplicationKey.from( "com.enonic.xp.app.main" ), "dashboard" );
        ControllerScript controllerScript = controllerScriptFactory.fromDir( scriptDir );
        return controllerScript.execute( portalRequest );
    }
}
