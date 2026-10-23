package com.enonic.xp.app.main;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class GetBuildShortHashScriptBeanTest
{
    private static final String SHORT_HASH_PROPERTY = "xp.build.shortHash";

    @AfterEach
    void tearDown()
    {
        System.clearProperty( SHORT_HASH_PROPERTY );
    }

    @Test
    void shortHash()
    {
        System.setProperty( SHORT_HASH_PROPERTY, "b741000" );
        assertEquals( "b741000", new GetBuildShortHashScriptBean().execute() );
    }

    @Test
    void missing()
    {
        System.clearProperty( SHORT_HASH_PROPERTY );
        assertNull( new GetBuildShortHashScriptBean().execute() );
    }

    @Test
    void notAvailable()
    {
        System.setProperty( SHORT_HASH_PROPERTY, "N/A" );
        assertNull( new GetBuildShortHashScriptBean().execute() );
    }
}
