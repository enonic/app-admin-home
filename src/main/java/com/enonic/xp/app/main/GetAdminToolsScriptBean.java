package com.enonic.xp.app.main;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.admin.tool.AdminToolDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.security.PrincipalKeys;

public final class GetAdminToolsScriptBean
    implements ScriptBean
{
    private AdminToolDescriptorService adminToolDescriptorService;

    private LocaleService localeService;

    private ApplicationKey appMainKey;

    public List<MapSerializable> execute( final List<String> locales )
    {
        final PrincipalKeys principals = ContextAccessor.current().
            getAuthInfo().
            getPrincipals();
        final StringTranslator stringTranslator = new StringTranslator( this.localeService, locales.stream().map( Locale::forLanguageTag ).toList() );

        return adminToolDescriptorService.getAllowedAdminToolDescriptors( principals )
            .stream()
            .filter( d -> !appMainKey.equals( d.getApplicationKey() )  )
            .sorted( Comparator.nullsLast( Comparator.comparing( AdminToolDescriptor::getDisplayName ) ) )
            .map( adminToolDescriptor -> new AdminToolMapper( adminToolDescriptor,
                                                              adminToolDescriptorService.getIconByKey( adminToolDescriptor.getKey() ),
                                                              stringTranslator ) )
            .collect( Collectors.toList() );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.appMainKey = context.getApplicationKey();
        this.adminToolDescriptorService = context.getService( AdminToolDescriptorService.class ).get();
        this.localeService = context.getService( LocaleService.class ).get();
    }
}
