package com.enonic.xp.app.main;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.web.servlet.ServletRequestHolder;

import static java.util.stream.Collectors.toList;

public final class StringTranslator
{
    private LocaleService localeService;

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
        final HttpServletRequest req = ServletRequestHolder.getRequest();
        if ( req == null )
        {
            return null;
        }

        final List<Locale> preferredLocales = Collections.list( req.getLocales() ).
            stream().
            map( this::resolveLanguage ).
            collect( toList() );

        return localeService.getSupportedLocale( preferredLocales, app );
    }

    private Locale resolveLanguage( final Locale locale )
    {
        final String lang = locale.getLanguage();
        if ( lang.equals( "nn" ) || lang.equals( "nb" ) )
        {
            return new Locale( "no" );
        }
        return locale;
    }
}
