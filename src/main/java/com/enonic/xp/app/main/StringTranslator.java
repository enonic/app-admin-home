package com.enonic.xp.app.main;

import java.util.List;
import java.util.Locale;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;

final class StringTranslator
{
    private final LocaleService localeService;

    private final List<Locale> locales;

    public StringTranslator( final LocaleService localeService, final List<Locale> locales )
    {
        this.localeService = localeService;
        this.locales = locales;
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
        return localeService.getSupportedLocale( locales, app );
    }
}
