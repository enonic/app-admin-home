# Enonic XP - Admin Home App
 Home application for Enonic XP admin

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a6ab0dd0d4d04b3d96e563a11056e536)](https://www.codacy.com/app/enonic/app-admin-home?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=enonic/app-admin-home&amp;utm_campaign=Badge_Grade)

This is the Home application for Enonic XP which contains the Dashboard and the XP menu that every admin tool embeds.

## Usage

Just copy the built JAR files to the `$XP_HOME/deploy` folder, or use the `deploy` task from the Gradle:

```
./gradlew deploy
```

## Building

Run the following command to build the application:
```
./gradlew build
```

The `env` parameter picks the build mode (`prod` or `dev`). The default is production; a development build keeps sourcemaps and skips minification:

```
./gradlew build -Penv=dev
```

## Embedding the XP menu

An admin tool embeds the menu with the `menu-loader` extension of this app. The loader is a module script that mounts the menu into an `<xp-menu>` host on `document.body`, in a shadow root with its own styles:

```js
const menuLoaderUrl = admin.extensionUrl({
    application: 'com.enonic.xp.app.main',
    extension: 'menu-loader',
    params: {theme: 'dark'}
});
```

```html
<script type="module" src="{{menuLoaderUrl}}"></script>
```

- `theme=light|dark` pins the menu theme for a tool without theming of its own. Without it the menu follows the theme stored by `@enonic/ui-utils` and the OS.
- `data-auto-mount="false"` on the script leaves mounting to the page: `window.XpMenu.mount({autoOpen, hideButtonWhenOpen})` and `window.XpMenu.unmount()`. `@enonic/ui-utils/admin-menu` wraps this.
- The menu refreshes its list of tools through the `admin:events` hub, which XP mounts under the admin tool that hosts the page. List `admin:events` in the `apis` of the tool descriptor, or the menu warns in the console and keeps the list it loaded.
- Under a Content-Security-Policy the menu needs `connect-src`, `img-src`, `font-src`, `script-src` and `worker-src` to allow `'self'`. It does not need `'unsafe-inline'` in `style-src`: its styles are constructed stylesheets, and inline styles in tool icons are applied through CSSOM.

