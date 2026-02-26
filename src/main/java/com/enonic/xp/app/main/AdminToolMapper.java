package com.enonic.xp.app.main;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

final class AdminToolMapper
    implements MapSerializable
{
    private final AdminToolDescriptor value;

    private final MessageBundle messages;

    AdminToolMapper( final AdminToolDescriptor value, final MessageBundle messages )
    {
        this.value = value;
        this.messages = messages;
    }

    private void serialize( final MapGenerator gen, final AdminToolDescriptor value )
    {
        gen.map( "key" );
        gen.value( "application", value.getKey().getApplicationKey().toString() );
        gen.value( "name", value.getKey().getName() );
        gen.end();
        gen.value( "displayName",
                   Optional.ofNullable( value.getDisplayNameI18nKey() ).map( messages::localize ).orElseGet( value::getDisplayName ) );
        gen.value( "description",
                   Optional.ofNullable( value.getDescription() ).map( messages::localize ).orElseGet( value::getDescription ) );
        gen.value( "icon", value.getIcon() != null ? new String( value.getIcon().toByteArray(), StandardCharsets.UTF_8 ) : null );
    }


    @Override
    public void serialize( final MapGenerator gen )
    {
        serialize( gen, this.value );
    }
}
