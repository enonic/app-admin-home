package com.enonic.xp.app.main;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.admin.tool.AdminToolDescriptorService;
import com.enonic.xp.admin.tool.AdminToolDescriptors;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.User;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.util.GenericValue;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetAdminToolsScriptBeanTest
{
    private static final ApplicationKey APP_MAIN_KEY = ApplicationKey.from( "com.enonic.xp.app.main" );

    @Mock
    private AdminToolDescriptorService adminToolDescriptorService;

    @Mock
    private LocaleService localeService;

    private GetAdminToolsScriptBean bean;

    @BeforeEach
    void setUp()
    {
        final BeanContext beanContext = mock( BeanContext.class );
        when( beanContext.getApplicationKey() ).thenReturn( APP_MAIN_KEY );
        when( beanContext.getService( AdminToolDescriptorService.class ) ).thenReturn( () -> adminToolDescriptorService );
        when( beanContext.getService( LocaleService.class ) ).thenReturn( () -> localeService );

        bean = new GetAdminToolsScriptBean();
        bean.initialize( beanContext );
    }

    @Test
    void toolsHiddenFromMenuAreExcluded()
    {
        final AdminToolDescriptor visible = tool( "com.enonic.app.myapp", "visible", "Visible" ).build();

        final AdminToolDescriptor hidden = tool( "com.enonic.app.myapp", "hidden", "Hidden" ).schemaConfig(
            GenericValue.newObject().put( "hideFromMenu", true ).build() ).build();

        final AdminToolDescriptor explicitlyVisible =
            tool( "com.enonic.app.myapp", "explicitly-visible", "Explicitly visible" ).schemaConfig(
                GenericValue.newObject().put( "hideFromMenu", false ).build() ).build();

        when( adminToolDescriptorService.getAll() ).thenReturn( AdminToolDescriptors.from( visible, hidden, explicitlyVisible ) );

        assertEquals( List.of( "explicitly-visible", "visible" ), executeAsAdmin() );
    }

    @Test
    void toolsWithoutAccessAreExcluded()
    {
        final PrincipalKey allowedRole = PrincipalKey.ofRole( "allowed.role" );

        final AdminToolDescriptor allowed =
            tool( "com.enonic.app.myapp", "allowed", "Allowed" ).addAllowedPrincipals( allowedRole ).build();

        final AdminToolDescriptor forbidden =
            tool( "com.enonic.app.myapp", "forbidden", "Forbidden" ).addAllowedPrincipals( PrincipalKey.ofRole( "other.role" ) ).build();

        when( adminToolDescriptorService.getAll() ).thenReturn( AdminToolDescriptors.from( allowed, forbidden ) );

        assertEquals( List.of( "allowed" ), execute( authInfo( allowedRole ) ) );
        assertEquals( List.of( "allowed", "forbidden" ), executeAsAdmin() );
    }

    @Test
    void dashboardOfMainAppIsFirstThenSortedByTitle()
    {
        final AdminToolDescriptor toolB = tool( "com.enonic.app.myapp", "tool-b", "B tool" ).build();
        final AdminToolDescriptor toolA = tool( "com.enonic.app.myapp", "tool-a", "A tool" ).build();
        final AdminToolDescriptor dashboard = tool( APP_MAIN_KEY.toString(), "dashboard", "Dashboard" ).build();

        when( adminToolDescriptorService.getAll() ).thenReturn( AdminToolDescriptors.from( toolB, toolA, dashboard ) );

        assertEquals( List.of( "dashboard", "tool-a", "tool-b" ), executeAsAdmin() );
    }

    private AdminToolDescriptor.Builder tool( final String appKey, final String name, final String title )
    {
        return AdminToolDescriptor.create().key( DescriptorKey.from( ApplicationKey.from( appKey ), name ) ).title( title );
    }

    private AuthenticationInfo authInfo( final PrincipalKey... principals )
    {
        return AuthenticationInfo.create().user( User.anonymous() ).principals( principals ).build();
    }

    private List<String> executeAsAdmin()
    {
        return execute( authInfo( RoleKeys.ADMIN ) );
    }

    private List<String> execute( final AuthenticationInfo authInfo )
    {
        lenient().when( localeService.getBundle( any(), any() ) ).thenReturn( mock( MessageBundle.class ) );

        final List<? extends MapSerializable> result =
            ContextBuilder.create().authInfo( authInfo ).build().callWith( () -> bean.execute( List.of( "en" ) ) );

        return result.stream().map( tool -> (String) serialize( tool ).get( "name" ) ).toList();
    }

    private static Map<String, Object> serialize( final MapSerializable serializable )
    {
        final Map<String, Object> values = new HashMap<>();
        serializable.serialize( new MapGenerator()
        {
            @Override
            public MapGenerator map()
            {
                return this;
            }

            @Override
            public MapGenerator map( final String key )
            {
                return this;
            }

            @Override
            public MapGenerator array()
            {
                return this;
            }

            @Override
            public MapGenerator array( final String key )
            {
                return this;
            }

            @Override
            public MapGenerator value( final Object value )
            {
                return this;
            }

            @Override
            public MapGenerator value( final String key, final Object value )
            {
                values.put( key, value );
                return this;
            }

            @Override
            public MapGenerator rawValue( final Object value )
            {
                return this;
            }

            @Override
            public MapGenerator rawValue( final String key, final Object value )
            {
                return this;
            }

            @Override
            public MapGenerator end()
            {
                return this;
            }
        } );
        return values;
    }
}
