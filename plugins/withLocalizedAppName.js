const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod, withInfoPlist } = require('@expo/config-plugins');

function withLocalizedAppName(config) {
  config = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:label'] = '@string/app_name';
      application.$['android:icon'] = '@drawable/notebook_app_icon';
      application.$['android:roundIcon'] = '@drawable/notebook_app_icon';
    }
    return modConfig;
  });

  config = withDangerousMod(config, ['android', (modConfig) => {
    const resourceDirectory = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
    const localizedResources = [
      ['values', 'Notebook'],
      ['values-ru', 'Блокнот'],
    ];

    localizedResources.forEach(([directory, appName]) => {
      const directoryPath = path.join(resourceDirectory, directory);
      const stringsPath = path.join(directoryPath, 'strings.xml');
      fs.mkdirSync(directoryPath, { recursive: true });
      const currentContents = fs.existsSync(stringsPath) ? fs.readFileSync(stringsPath, 'utf8') : '<resources>\n</resources>\n';
      const appNameEntry = `    <string name="app_name">${appName}</string>`;
      const nextContents = currentContents.includes('name="app_name"')
        ? currentContents.replace(/\s*<string name="app_name">.*?<\/string>/, `\n${appNameEntry}`)
        : currentContents.replace('</resources>', `\n${appNameEntry}\n</resources>`);
      fs.writeFileSync(stringsPath, nextContents);
    });

    fs.mkdirSync(path.join(resourceDirectory, 'drawable'), { recursive: true });
    fs.mkdirSync(path.join(resourceDirectory, 'drawable-night'), { recursive: true });
    fs.copyFileSync(
      path.join(modConfig.modRequest.projectRoot, 'assets', 'notebook-icon-light.png'),
      path.join(resourceDirectory, 'drawable', 'notebook_app_icon.png'),
    );
    fs.copyFileSync(
      path.join(modConfig.modRequest.projectRoot, 'assets', 'notebook-icon-dark.png'),
      path.join(resourceDirectory, 'drawable-night', 'notebook_app_icon.png'),
    );
    fs.copyFileSync(
      path.join(modConfig.modRequest.projectRoot, 'assets', 'splash-icon.png'),
      path.join(resourceDirectory, 'drawable', 'splashscreen_logo.png'),
    );

    return modConfig;
  }]);

  config = withInfoPlist(config, (modConfig) => {
    modConfig.modResults.CFBundleDisplayName = 'Notebook';
    return modConfig;
  });

  return withDangerousMod(config, ['ios', (modConfig) => {
    const iosDirectory = modConfig.modRequest.platformProjectRoot;
    const projectDirectory = fs.readdirSync(iosDirectory, { withFileTypes: true })
      .find((entry) => entry.isDirectory() && fs.existsSync(path.join(iosDirectory, `${entry.name}.xcodeproj`)))?.name;
    if (!projectDirectory) return modConfig;

    [
      ['en.lproj', 'Notebook'],
      ['ru.lproj', 'Блокнот'],
    ].forEach(([localeDirectory, appName]) => {
      const directoryPath = path.join(iosDirectory, projectDirectory, localeDirectory);
      fs.mkdirSync(directoryPath, { recursive: true });
      fs.writeFileSync(path.join(directoryPath, 'InfoPlist.strings'), `CFBundleDisplayName = "${appName}";\n`);
    });

    return modConfig;
  }]);
}

module.exports = withLocalizedAppName;
