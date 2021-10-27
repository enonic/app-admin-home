package com.enonic.xp.app.main;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.web.servlet.ServletRequestHolder;

final class StringTranslator
{
    private final LocaleService localeService;

    public StringTranslator( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    public String localize( final ApplicationKey app, final String key, final String defaultValue )
    {
        final MessageBundle bundle = this.localeService.getBundle( app, getLocale( app ) );

        if ( bundle == null )
        {
            return defaultValue;
        }
        final String localizedValue = bundle.localize( key );
        return localizedValue != null ? localizedValue : defaultValue;
    }

    private Locale getLocale( final ApplicationKey app )
    {
        return localeService.getSupportedLocale( getPreferredLocales(), app );
    }

    private List<Locale> getPreferredLocales()
    {
        final HttpServletRequest req = ServletRequestHolder.getRequest();
        if ( req == null )
        {
            return Collections.emptyList();
        }

        return Collections.list( req.getLocales() );
    }
}
