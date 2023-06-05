package com.enonic.xp.app.main.rest.resource.widget;

import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.admin.widget.WidgetDescriptor;
import com.enonic.xp.admin.widget.WidgetDescriptorService;
import com.enonic.xp.app.main.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.main.rest.resource.ResourceConstants;
import com.enonic.xp.app.main.rest.resource.widget.json.WidgetDescriptorJson;
import com.enonic.xp.descriptor.Descriptors;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;

import static com.google.common.base.Strings.isNullOrEmpty;
import static java.util.stream.Collectors.toList;

@Path(ResourceConstants.REST_ROOT + "widget")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2main")
public class WidgetResource
    implements JaxRsComponent
{

    private WidgetDescriptorService widgetDescriptorService;

    private LocaleService localeService;

    @POST
    @Path("list/byinterfaces")
    public List<WidgetDescriptorJson> getByInterfaces( final String[] widgetInterfaces )
    {
        final Descriptors<WidgetDescriptor> widgetDescriptors = this.widgetDescriptorService.getAllowedByInterfaces( widgetInterfaces );
        return widgetDescriptorsToJsonList( widgetDescriptors );
    }

    private List<WidgetDescriptorJson> widgetDescriptorsToJsonList( final Descriptors<WidgetDescriptor> descriptors )
    {
        return descriptors.stream().map( this::convertToJsonAndLocalize ).collect( toList() );
    }

    private WidgetDescriptorJson convertToJsonAndLocalize( final WidgetDescriptor widgetDescriptor )
    {
        final WidgetDescriptorJson json = new WidgetDescriptorJson( widgetDescriptor );

        if ( !isNullOrEmpty( widgetDescriptor.getDisplayNameI18nKey() ) || !isNullOrEmpty( widgetDescriptor.getDescriptionI18nKey() ) )
        {
            final LocaleMessageResolver messageResolver = new LocaleMessageResolver( localeService, widgetDescriptor.getApplicationKey() );

            if ( !isNullOrEmpty( widgetDescriptor.getDisplayNameI18nKey() ) )
            {
                json.displayName =
                        messageResolver.localizeMessage( widgetDescriptor.getDisplayNameI18nKey(), widgetDescriptor.getDisplayName() );
            }

            if ( !isNullOrEmpty( widgetDescriptor.getDescriptionI18nKey() ) )
            {
                json.description =
                        messageResolver.localizeMessage( widgetDescriptor.getDescriptionI18nKey(), widgetDescriptor.getDescription() );
            }
        }

        return json;
    }

    @Reference
    public void setWidgetDescriptorService( final WidgetDescriptorService widgetDescriptorService )
    {
        this.widgetDescriptorService = widgetDescriptorService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }
}
