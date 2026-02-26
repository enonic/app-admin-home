package com.enonic.xp.app.main;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Predicate;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.admin.tool.AdminToolDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
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

    public List<? extends MapSerializable> execute( final List<String> localeTags )
    {
        final List<Locale> locales = localeTags.stream().map( Locale::forLanguageTag ).toList();

        final PrincipalKeys principals = ContextAccessor.current().getAuthInfo().getPrincipals();

        return adminToolDescriptorService.getAll()
            .stream()
            .filter( Predicate.not( adminToolDescriptor -> adminToolDescriptor.getKey().getApplicationKey().equals( appMainKey ) ) )
            .filter( adminToolDescriptor -> adminToolDescriptor.isAccessAllowed( principals ) )
            .sorted( Comparator.nullsLast( Comparator.comparing( AdminToolDescriptor::getDisplayName ) ) )
            .map( adminToolDescriptor -> new AdminToolMapper( adminToolDescriptor,
                                                              getMessageBundle( adminToolDescriptor.getKey().getApplicationKey(),
                                                                                locales ) ) )
            .toList();

    }

    private MessageBundle getMessageBundle( final ApplicationKey appKey, final List<Locale> locales )
    {
        return this.localeService.getBundle( appKey, this.localeService.getSupportedLocale( locales, appKey ) );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.appMainKey = context.getApplicationKey();
        this.adminToolDescriptorService = context.getService( AdminToolDescriptorService.class ).get();
        this.localeService = context.getService( LocaleService.class ).get();
    }
}
