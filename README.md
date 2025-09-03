# Enonic XP - Admin Home App
 Home application for Enonic XP admin

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a6ab0dd0d4d04b3d96e563a11056e536)](https://www.codacy.com/app/enonic/app-admin-home?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=enonic/app-admin-home&amp;utm_campaign=Badge_Grade)

This is the Home application for Enonic XP which contains Dashboard, shortcuts and Launcher panel.

## Usage

Just copy the built JAR files to the `$XP_HOME/deploy` folder, or use the `deploy` task from the Gradle:

```
./gradlew deploy
```

## Building

#### Default

Run the following command to build all applications with default options:
```
./gradlew build
```

With default build, applications will use the remote `lib-admin-ui` dependency and the environment variable won't be set.

#### Environment

To use the specific environment, you must set its value explicitly with `env` parameter (only `prod` or `dev`):

```
./gradlew build -Penv=dev
```

If the environment is set, the Gradle will look for the local `lib-admin-ui` repository in the parent folder of your `app-admin-home` repo. And if any present, will build them, along with building applications, instead of downloading the remote `lib-admin-ui` dependency.
The environment parameter will also be passed to `lib-admin-ui`.

Both environments are almost identical, except that building in the development environment will result in creating the DTS files, sourcemaps and other things, critical for the debugging.
The build itself may also be a bit slower sometimes.

#### Quick

Sometimes, you may want to build your project faster. To do so, just skip some tasks. You can skip them manually, like this:

```
./gradlew build -x check -x test
```

or run even faster with the `yolo` task, that will skip all tasks, that won't affect the code operability, and do deploy build:

```
./gradlew yolo
```

<!-- Links -->

[license-url]: LICENSE.txt
[license-image]: https://img.shields.io/github/license/enonic/app-users.svg "GPL 3.0"
